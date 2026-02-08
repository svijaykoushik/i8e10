// A map to store resolvers for pending requests
const pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>();
let workerPromise: Promise<Worker> | null = null;

/**
 * Creates a worker by fetching the script content and creating a Blob URL.
 * This is a robust method that avoids pathing issues related to `import.meta.url`
 * or different server configurations.
 */
const createWorkerFromBlob = async (): Promise<Worker> => {
    try {
        return new Worker(new URL('../utils/crypto.worker', import.meta.url))
    } catch (error) {
        console.error("Failed to create worker from blob:", error);
        // This will reject the workerPromise
        throw error;
    }
};


const getWorker = (): Promise<Worker> => {
    if (!workerPromise) {
        workerPromise = (async () => {
            try {
                const worker = await createWorkerFromBlob();

                worker.onmessage = (event) => {
                    const { id, type, payload } = event.data;
                    const promise = pendingRequests.get(id);

                    if (promise) {
                        if (type === 'success') {
                            promise.resolve(payload);
                        } else {
                            const error = new Error(payload.message);
                            error.stack = payload.stack;
                            promise.reject(error);
                        }
                        pendingRequests.delete(id);
                    }
                };
                
                worker.onerror = (errorEvent: ErrorEvent) => {
                    const errorMessage = `Crypto worker error: ${errorEvent.message || 'Failed to load or execute script.'}`;
                    console.error(errorMessage, errorEvent);
                    const workerError = new Error(errorMessage);

                    // Reject all pending promises on a catastrophic worker error
                    pendingRequests.forEach(promise => promise.reject(workerError));
                    pendingRequests.clear();
                    // Reset the promise to allow for a potential retry
                    workerPromise = null;
                };

                return worker;

            } catch (error) {
                // If creating the worker fails, reset the promise to allow retrying.
                workerPromise = null;
                console.error("Worker initialization failed:", error);
                throw error;
            }
        })();
    }
    return workerPromise;
};

const sendRequest = async <T>(type: string, payload: any): Promise<T> => {
    const worker = await getWorker();
    return new Promise((resolve, reject) => {
        const id = crypto.randomUUID();
        pendingRequests.set(id, { resolve, reject });
        worker.postMessage({ id, type, payload });
    });
};

export const setupInWorker = (password: string) => {
    return sendRequest<any>('setup', { password });
};

export const verifyInWorker = (password: string, saltB64: string, wrappedMasterKeyB64: string, verifierJSON: string) => {
    return sendRequest<any>('verify', { password, saltB64, wrappedMasterKeyB64, verifierJSON });
};

export const recoverInWorker = (phrase: string, newPassword: string, saltB64: string, wrappedMasterKeyByRecoveryB64: string, storedPhraseHash: string) => {
    return sendRequest<any>('recover', { phrase, newPassword, saltB64, wrappedMasterKeyByRecoveryB64, storedPhraseHash });
};

export const encryptInWorker = (data: string, jwk: JsonWebKey) => {
    return sendRequest<any>('encrypt', {data, jwk });
};

export const decryptInWorker = (encryptedData: { iv: string; ciphertext: string }, jwk: JsonWebKey) => {
    return sendRequest<any>('decrypt', { encryptedData, jwk });
};
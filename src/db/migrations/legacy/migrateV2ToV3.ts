export const migrateV2toV3 = async (ctx: { tx: IDBTransaction }) => {
    const txStore = ctx.tx.objectStore('transactionItems');
    const walletsStore = ctx.tx.objectStore('wallets');
    const settingsStore = ctx.tx.objectStore('settings');

    const getAll = (store: IDBObjectStore): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    };

    const transactions = await getAll(txStore);
    const settingsItems = await getAll(settingsStore);

    const walletsSetting = settingsItems.find((s) => s.key === 'wallets');
    const currentDefaultWalletSetting = settingsItems.find(
        (s) => s.key === 'defaultWallet',
    );

    const existingWalletNames: string[] = walletsSetting?.value ?? [
        'Cash / ரொக்கம்',
        'Bank / வங்கி',
    ];

    const capturedUniqueWallets = new Set(existingWalletNames);

    transactions.forEach((tx) => {
        if (tx.wallet) capturedUniqueWallets.add(tx.wallet);
    });

    const walletNameMap = new Map<string, string>();

    for (const name of Array.from(capturedUniqueWallets)) {
        const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

        let type = 'other';
        const lower = name.toLowerCase();
        if (lower.includes('bank') || lower.includes('வங்கி')) type = 'bank';
        else if (lower.includes('cash') || lower.includes('ரொக்கம்'))
            type = 'cash';

        const walletObj = {
            id,
            name,
            type,
            isDefault: name === currentDefaultWalletSetting?.value,
            isArchived: false,
        };

        walletNameMap.set(name, id);

        await new Promise<void>((res, rej) => {
            const req = walletsStore.add(walletObj);
            req.onsuccess = () => res();
            req.onerror = () => rej(req.error);
        });
    }

    for (const tx of transactions) {
        if (tx.wallet && walletNameMap.has(tx.wallet)) {
            tx.walletId = walletNameMap.get(tx.wallet);
            delete tx.wallet;
        }

        await new Promise<void>((res, rej) => {
            const req = txStore.put(tx);
            req.onsuccess = () => res();
            req.onerror = () => rej(req.error);
        });
    }

    await new Promise<void>((res, rej) => {
        const req = settingsStore.delete('wallets');
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
    });

    if (
        currentDefaultWalletSetting &&
        walletNameMap.has(currentDefaultWalletSetting.value)
    ) {
        currentDefaultWalletSetting.value = walletNameMap.get(
            currentDefaultWalletSetting.value,
        );

        await new Promise<void>((res, rej) => {
            const req = settingsStore.put(currentDefaultWalletSetting);
            req.onsuccess = () => res();
            req.onerror = () => rej(req.error);
        });
    }
};

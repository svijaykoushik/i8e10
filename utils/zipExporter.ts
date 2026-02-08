

// This utility requires a library like JSZip. We'll add it via a CDN.
const JSZIP_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

let jszipPromise: Promise<any> | null = null;

const loadJsZip = (): Promise<any> => {
  if (!jszipPromise) {
    jszipPromise = new Promise((resolve, reject) => {
      if (window.JSZip) {
        resolve(window.JSZip);
        return;
      }
      const script = document.createElement('script');
      script.src = JSZIP_CDN;
      script.onload = () => {
        if (window.JSZip) {
          resolve(window.JSZip);
        } else {
          reject(new Error('JSZip not found on window object after loading script.'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load JSZip script.'));
      document.head.appendChild(script);
    });
  }
  return jszipPromise;
};

interface ExportData {
    transactionCSV?: string;
    debtCSV?: string;
    debtInstallmentsCSV?: string;
    investmentCSV?: string;
    investmentTransactionsCSV?: string;
}

export const exportToZip = async (data: ExportData) => {
    try {
        const JSZip = await loadJsZip();
        const zip = new JSZip();

        if(data.transactionCSV) {
            zip.file("transactions.csv", data.transactionCSV);
        }
        if(data.debtCSV) {
            zip.file("debts.csv", data.debtCSV);
        }
        if(data.debtInstallmentsCSV){
          zip.file("debtInstallments.csv", data.debtInstallmentsCSV)
        }
        if(data.investmentCSV) {
            zip.file("investments.csv", data.investmentCSV);
        }
        if(data.investmentTransactionsCSV) {
            zip.file("investment_transactions.csv", data.investmentTransactionsCSV);
        }

        const content = await zip.generateAsync({ type: "blob" });

        const link = document.createElement('a');
        const url = URL.createObjectURL(content);
        link.setAttribute('href', url);
        link.setAttribute('download', 'i8e10-export.zip');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Failed to create zip file:", error);
        throw error;
    }
};

export const readZip = async (file: File): Promise<Record<string, string>> => {
    const JSZip = await loadJsZip();
    const zip = await JSZip.loadAsync(file);
    const files: Record<string, string> = {};
    
    const promises = Object.keys(zip.files).map(async (filename) => {
        const fileData = zip.files[filename];
        if (!fileData.dir) {
            const content = await fileData.async('string');
            files[filename] = content;
        }
    });

    await Promise.all(promises);
    return files;
};


// Add a declaration for the JSZip object on the window
declare global {
    interface Window {
        JSZip: any;
    }
}
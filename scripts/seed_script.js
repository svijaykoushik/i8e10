
// This script is intended to be run in the browser console or via a temporary UI component.
// Since I cannot run browser JS from here directly into the user's running browser session context easily without an extension or manual paste,
// I will create a React component that the user can mount temporarily, or a robust standalone script they can paste into the console.

// Standalone Console Script version for "i8e10DB"
// Paste this into the browser console at http://localhost:36373/

(function seedData() {
    const DB_NAME = "i8e10DB";
    const DB_VERSION = 2; // Matches database.ts

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
        console.error("Database error:", event.target.error);
    };

    request.onsuccess = (event) => {
        const db = event.target.result;
        seedTransactions(db);
        seedDebts(db);
        seedInvestments(db);
        console.log("Seeding initiated...");
    };

    function generateId() {
        return crypto.randomUUID();
    }

    function seedTransactions(db) {
        const tx = db.transaction(["transactionItems"], "readwrite");
        const store = tx.objectStore("transactionItems");

        const transactions = [
            { id: generateId(), amount: 85000, type: "income", category: "Salary", date: new Date(Date.now() - 86400000 * 2).toISOString(), notes: "October Salary", wallet: "Savings" },
            { id: generateId(), amount: 15000, type: "expense", category: "Rent", date: new Date(Date.now() - 86400000 * 5).toISOString(), notes: "Monthly Rent", wallet: "Savings" },
            { id: generateId(), amount: 3500, type: "expense", category: "Groceries", date: new Date(Date.now() - 86400000 * 1).toISOString(), notes: "Supermarket run", wallet: "Cash" },
            { id: generateId(), amount: 1200, type: "expense", category: "Transport", date: new Date(Date.now() - 86400000 * 0.5).toISOString(), notes: "Uber", wallet: "Credit Card" },
            { id: generateId(), amount: 5000, type: "transfer", category: "Transfer", date: new Date(Date.now() - 86400000 * 10).toISOString(), notes: "Savings to Cash", fromWallet: "Savings", toWallet: "Cash" },
        ];

        transactions.forEach(item => store.put(item));

        tx.oncomplete = () => console.log("Transactions seeded.");
        tx.onerror = (e) => console.error("Transaction seed failed", e);
    }

    function seedDebts(db) {
        const tx = db.transaction(["debts"], "readwrite");
        const store = tx.objectStore("debts");

        const debts = [
            { id: generateId(), amount: 5000, type: "lent", person: "Ravi", date: new Date(Date.now() - 86400000 * 20).toISOString(), status: "outstanding", notes: "Lunch money loan" },
            { id: generateId(), amount: 10000, type: "borrowed", person: "Bank", date: new Date(Date.now() - 86400000 * 30).toISOString(), status: "outstanding", notes: "Personal Loan" },
            { id: generateId(), amount: 2000, type: "lent", person: "Sarah", date: new Date(Date.now() - 86400000 * 60).toISOString(), status: "settled", notes: "Concert tickets" },
        ];

        debts.forEach(item => store.put(item));

        tx.oncomplete = () => console.log("Debts seeded.");
    }

    function seedInvestments(db) {
        const tx = db.transaction(["investments"], "readwrite");
        const store = tx.objectStore("investments");

        const investments = [
            { id: generateId(), name: "Nifty 50 ETF", amount: 50000, currentValue: 55000, type: "mutual_fund", status: "active", startDate: new Date(Date.now() - 86400000 * 100).toISOString() },
            { id: generateId(), name: "Gold Bonds", amount: 20000, currentValue: 21500, type: "gold", status: "active", startDate: new Date(Date.now() - 86400000 * 200).toISOString() },
        ];

        investments.forEach(item => store.put(item));

        tx.oncomplete = () => console.log("Investments seeded.");
    }
})();

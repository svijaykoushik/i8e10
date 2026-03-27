export const legacySchema = {
    transactionItems: {
        key: { path: 'id' },
        indexes: [
            { name: 'date' },
            { name: 'wallet' },
            { name: 'walletId' },
            { name: 'type' },
            { name: 'transferId' },
            { name: 'investmentTransactionId' },
            { name: 'debtId' },
            { name: 'debtInstallMentId' },
        ],
    },
    debts: { key: { path: 'id' }, indexes: [{ name: 'date' }, { name: 'status' }, { name: 'type' }] },
    investments: {
        key: { path: 'id' },
        indexes: [{ name: 'startDate' }, { name: 'status' }, { name: 'type' }],
    },
    investmentTransactions: {
        key: { path: 'id' },
        indexes: [{ name: 'investmentId' }, { name: 'date' }, { name: 'type' }],
    },
    debtInstallments: {
        key: { path: 'id' },
        indexes: [{ name: 'debtId' }, { name: 'date' }],
    },
    settings: { key: { path: 'key' }, indexes: [] },
    wallets: { key: { path: 'id' }, indexes: [{ name: 'name' }] },
};

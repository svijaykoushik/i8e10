export const ledgerSchema = {
    accounts: {
        key: { path: 'id' },
        indexes: [
            { name: 'type' },
            { name: 'subType' },
            { name: 'name' },
            { name: 'isArchived' },
        ],
    },
    transactions: {
        key: { path: 'id' },
        indexes: [
            { name: 'date' },
            { name: 'type' },
            { name: 'isReverted' },
            { name: 'createdAt' },
            { name: 'currencyCode' },
            { name: 'accountIds', multiEntry: true },
        ],
    },
    settings: { key: { path: 'key' }, indexes: [] },
};

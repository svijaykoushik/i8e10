
import { openDB } from 'idb';

const SEED_DATA = {
  transactions: [
    { id: 't1', amount: 5000, type: 'income', category: 'Salary', date: new Date().toISOString(), description: 'Monthly Salary' },
    { id: 't2', amount: 150, type: 'expense', category: 'Food', date: new Date().toISOString(), description: 'Lunch' },
    { id: 't3', amount: 2000, type: 'expense', category: 'Rent', date: new Date().toISOString(), description: 'Monthly Rent' },
  ],
  debts: [
    { id: 'd1', amount: 1000, type: 'lent', person: 'Alice', date: new Date().toISOString(), status: 'outstanding' },
    { id: 'd2', amount: 500, type: 'borrowed', person: 'Bob', date: new Date().toISOString(), status: 'outstanding' },
  ],
  investments: [
    { id: 'i1', name: 'Stock Market', currentValue: 10500, investedAmount: 10000, type: 'active' },
  ]
};

async function seed() {
  // This is a placeholder. I need to know the actual DB name and schema.
  // I will inspect src/db/index.ts or similar first.
  console.log("Seeding...", SEED_DATA);
}

seed();

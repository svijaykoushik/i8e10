import { describe, it, expect } from 'vitest';
import { numberToWords } from '../utils/numberToWords';

describe('numberToWords', () => {
    it('converts basic numbers', () => {
        expect(numberToWords(0)).toBe('Zero Rupees Only');
        expect(numberToWords(5)).toBe('Five Rupees Only');
        expect(numberToWords(15)).toBe('Fifteen Rupees Only');
        expect(numberToWords(45)).toBe('Forty Five Rupees Only');
    });

    it('converts hundreds and thousands', () => {
        expect(numberToWords(100)).toBe('One Hundred Rupees Only');
        expect(numberToWords(105)).toBe('One Hundred Five Rupees Only');
        expect(numberToWords(1000)).toBe('One Thousand Rupees Only');
        expect(numberToWords(1500)).toBe('One Thousand Five Hundred Rupees Only');
    });

    it('converts lakhs and crores', () => {
        expect(numberToWords(100000)).toBe('One Lakh Rupees Only');
        expect(numberToWords(150000)).toBe('One Lakh Fifty Thousand Rupees Only');
        expect(numberToWords(10000000)).toBe('One Crore Rupees Only');
        expect(numberToWords(15000000)).toBe('One Crore Fifty Lakh Rupees Only');
        expect(numberToWords(175500)).toBe('One Lakh Seventy Five Thousand Five Hundred Rupees Only');
    });

    it('handles negative numbers by absolute value', () => {
        expect(numberToWords(-15500)).toBe('Fifteen Thousand Five Hundred Rupees Only');
    });
});

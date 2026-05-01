export function numberToWords(num: number): string {
    if (num === 0) return "Zero Rupees Only";
    
    const single = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    const formatTens = (n: number) => {
        if (n < 10) return single[n];
        if (n < 20) return double[n - 10];
        const t = Math.floor(n / 10);
        const o = n % 10;
        return tens[t] + (o > 0 ? " " + single[o] : "");
    };

    const convertGroup = (n: number) => {
        let str = "";
        if (n > 99) {
            str += single[Math.floor(n / 100)] + " Hundred ";
            n = n % 100;
        }
        if (n > 0) {
            str += formatTens(n);
        }
        return str.trim();
    };

    let word = "";
    let integerPart = Math.floor(Math.abs(num));
    
    if (integerPart === 0) {
        return "Zero Rupees Only";
    }

    if (integerPart > 9999999) {
        const crores = Math.floor(integerPart / 10000000);
        word += convertGroup(crores) + " Crore ";
        integerPart %= 10000000;
    }
    if (integerPart > 99999) {
        const lakhs = Math.floor(integerPart / 100000);
        word += convertGroup(lakhs) + " Lakh ";
        integerPart %= 100000;
    }
    if (integerPart > 999) {
        const thousands = Math.floor(integerPart / 1000);
        word += convertGroup(thousands) + " Thousand ";
        integerPart %= 1000;
    }
    if (integerPart > 0) {
        word += convertGroup(integerPart);
    }
    
    return (word.trim() + " Rupees Only").replace(/\s+/g, ' ');
}

const fmt = new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', maximumFractionDigits: 0 });
export const formatMoney = (n: number) => fmt.format(n);

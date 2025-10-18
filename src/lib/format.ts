export const money = (value: number, currency: string = 'ILS', locale = 'he-IL') => {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value || 0);
  } catch {
    return `${(value ?? 0).toFixed?.(2) ?? '0.00'} ${currency}`;
  }
};

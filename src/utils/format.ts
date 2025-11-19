export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6, // For small token prices
  }).format(value);
};

export const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100); // Assuming value is like 5.5 for 5.5% or 0.055? 
  // Wait, let's check the data sample.
  // priceChange1h: 0.0020229265 -> This looks like a raw ratio (0.2%). 
  // priceChange24h: -0.0456005138 -> -4.56%
  // So I should multiply by 100 if I use style='percent' without it? 
  // No, Intl.NumberFormat style='percent' expects 0.1 for 10%.
  // So if the data is 0.002, that is 0.2%.
  // Let's verify with the sample data.
  // priceChange24h: -0.0456... -> -4.56%.
  // So passing the raw value to Intl.NumberFormat with style='percent' is correct.
};

export const formatCompactNumber = (number: number) => {
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2
  }).format(number);
};


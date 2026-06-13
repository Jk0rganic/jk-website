export const calculateTotal = (priceString: string, quantity: number) => {
  const cleanPrice = parseFloat(priceString.replace(/[$,]/g, "")) || 0;
  const cleanQuantity = parseInt(String(quantity), 10) || 0;
  return cleanPrice * cleanQuantity;
};
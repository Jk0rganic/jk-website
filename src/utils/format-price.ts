export const formatPrice = (price: string | number) => {
  if (!price) return "KSh 0";

  const numeric = parseFloat(
    String(price)
      .replace(/&nbsp;/g, " ")
      .replace(/[^0-9.]/g, ""),
  );

  if (isNaN(numeric)) return "KSh 0";

  // 👉 Round UP if decimals exist
  const finalValue = numeric % 1 === 0 ? numeric : Math.ceil(numeric);

  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(finalValue);

  return `KSh ${formatted}`;
};

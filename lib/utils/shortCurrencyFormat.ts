export const shortCurrencyFormat = (num: number, fraction = 2) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    compactDisplay: "long",
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(num);

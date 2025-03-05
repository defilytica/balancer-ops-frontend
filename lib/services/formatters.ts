export function formatUSD(
  value: number,
  options: {
    useShorthand?: boolean;
    decimalPlaces?: number;
    showZeroDecimals?: boolean;
  } = {}
): string {
  const {
    useShorthand = false,
    decimalPlaces = 2,
    showZeroDecimals = true
  } = options;

  if (value === 0) {
    return showZeroDecimals ? "$0.00" : "$0";
  }

  if (useShorthand && Math.abs(value) >= 1000) {
    // Handle shorthand notation for large numbers
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (absValue >= 1_000_000_000) {
      // Billions
      const formatted = (absValue / 1_000_000_000).toFixed(decimalPlaces);
      return `${sign}$${stripTrailingZeros(formatted, showZeroDecimals)}B`;
    } else if (absValue >= 1_000_000) {
      // Millions
      const formatted = (absValue / 1_000_000).toFixed(decimalPlaces);
      return `${sign}$${stripTrailingZeros(formatted, showZeroDecimals)}M`;
    } else if (absValue >= 1_000) {
      // Thousands
      const formatted = (absValue / 1_000).toFixed(decimalPlaces);
      return `${sign}$${stripTrailingZeros(formatted, showZeroDecimals)}k`;
    }
  }

  // Standard formatting using Intl.NumberFormat
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showZeroDecimals ? decimalPlaces : 0,
    maximumFractionDigits: decimalPlaces
  });

  return formatter.format(value);
}

/**
 * Helper function to remove trailing zeros from decimal numbers when needed
 */
function stripTrailingZeros(numStr: string, showZeroDecimals: boolean): string {
  if (!showZeroDecimals) {
    // If the number has only zeros after decimal, remove the decimal part
    if (numStr.includes('.') && !numStr.split('.')[1].match(/[1-9]/)) {
      return numStr.split('.')[0];
    }

    // Remove trailing zeros
    return numStr.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }

  return numStr;
}

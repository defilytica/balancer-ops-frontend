export const toFixedDecimals = (value: number) => {
    let fixedDecimals = 2;
    const absValue = Math.abs(value);
  
    if (absValue >= 1000) {
      fixedDecimals = 2;
    } else if (absValue >= 100) {
      fixedDecimals = 3;
    } else if (absValue >= 10) {
      fixedDecimals = 4;
    } else if (absValue >= 1) {
      fixedDecimals = 5;
    } else {
      fixedDecimals = 6;
    }
  
    return value.toFixed(fixedDecimals);
  };
// All functions are adapted from the solidity ones to be found on:
// https://github.com/balancer-labs/balancer-core-v2/blob/master/contracts/pools/stable/StableMath.sol

// TODO: implement all up and down rounding variations

/**********************************************************************************************
    // invariant                                                                                 //
    // D = invariant to compute                                                                  //
    // A = amplifier                n * D^2 + A * n^n * S * (n^n * P / D^(n−1))                  //
    // S = sum of balances         ____________________________________________                  //
    // P = product of balances    (n+1) * D + ( A * n^n − 1)* (n^n * P / D^(n−1))                //
    // n = number of tokens                                                                      //
    **********************************************************************************************/
export function stableInvariant(
  amp: number, // amp
  balances: number[], // balances
): number {
  let sum = 0;
  const totalCoins = balances.length;
  for (let i = 0; i < totalCoins; i++) {
    sum = sum + balances[i];
  }
  if (sum == 0) {
    return 0;
  }
  let prevInv = 0;
  let inv = sum;

  // amp is passed as an ethers bignumber while maths uses bignumber.js
  const ampTimesNpowN = amp * totalCoins ** totalCoins; // A*n^n

  for (let i = 0; i < 255; i++) {
    let P_D = totalCoins * balances[0];
    for (let j = 1; j < totalCoins; j++) {
      //P_D is rounded up
      P_D = (P_D * balances[j] * totalCoins) / inv;
    }
    prevInv = inv;
    //inv is rounded up
    inv =
      (totalCoins * inv * inv + ampTimesNpowN * sum * P_D) /
      ((totalCoins + 1) * inv + (ampTimesNpowN - 1) * P_D);
    // Equality with the precision of 1
    if (Math.abs(inv - prevInv) < 1) {
      break;
    }
  }
  //Result is rounded up
  return inv;
}

//This function calculates the balance of a given token (tokenIndex)
// given all the other balances and the invariant
export function getTokenBalanceGivenInvariantAndAllOtherBalances(
  amp: number,
  balances: number[],
  inv: number,
  tokenIndex: number,
): number {
  let p = inv;
  let sum = 0;
  const totalCoins = balances.length;
  let nPowN = 1;
  let x = 0;
  for (let i = 0; i < totalCoins; i++) {
    nPowN = nPowN * totalCoins;
    if (i != tokenIndex) {
      x = balances[i];
    } else {
      continue;
    }
    sum = sum + x;
    //Round up p
    p = (p * inv) / x;
  }

  // Calculate token balance
  return _solveAnalyticalBalance(sum, inv, amp, nPowN, p);
}

//This function calcuates the analytical solution to find the balance required
export function _solveAnalyticalBalance(
  sum: number,
  inv: number,
  amp: number,
  n_pow_n: number,
  p: number,
): number {
  //Round up p
  p = (p * inv) / (amp * n_pow_n * n_pow_n);
  //Round down b
  const b = sum + inv / (amp * n_pow_n);
  //Round up c
  // let c = inv >= b
  //     ? inv.minus(b).plus(Math.sqrtUp(inv.minus(b).times(inv.minus(b)).plus(p.times(4))))
  //     : Math.sqrtUp(b.minus(inv).times(b.minus(inv)).plus(p.times(4))).minus(b.minus(inv));
  let c;
  c = inv - b + Math.sqrt(Math.pow(inv - b, 2) + 4 * p);
  //Round up y
  return c / 2;
}

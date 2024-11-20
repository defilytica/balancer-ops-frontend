import {TokenWithBalance} from "@/types/interfaces";

export const optimizeAmounts = (tokens: TokenWithBalance[]): TokenWithBalance[] => {
    // Filter tokens with valid weights and prices
    const validTokens = tokens.filter(t =>
        t.price &&
        t.weight &&
        !isNaN(t.price) &&
        t.price > 0 &&
        t.weight > 0
    );

    if (validTokens.length < 2) return tokens;

    // Check if we have any pre-filled amounts
    const hasPrefilledAmounts = validTokens.some(t => parseFloat(t.amount || '0') > 0);

    // Calculate maximum possible ratio for each token based on its balance
    const tokenRatios = validTokens.map(token => {
        const maxBalance = token.balance ? parseFloat(token.balance) : Infinity;
        const maxUsdValue = maxBalance * token.price!;
        const ratioPerWeight = maxUsdValue / token.weight!;

        return {
            token,
            maxBalance,
            maxUsdValue,
            ratioPerWeight
        };
    });

    // Find the limiting ratio (lowest USD per weight that satisfies all balance constraints)
    const limitingRatio = tokenRatios.reduce((minRatio, { ratioPerWeight }) => {
        if (ratioPerWeight < minRatio) {
            return ratioPerWeight;
        }
        return minRatio;
    }, Infinity);

    if (hasPrefilledAmounts) {
        // Find valid reference token with lowest USD/weight ratio from pre-filled amounts
        let referenceToken = validTokens[0]; // Start with first token
        let lowestRatio = Infinity;

        validTokens.forEach(token => {
            const amount = parseFloat(token.amount || '0');
            if (amount > 0) {
                const usdValue = amount * token.price!;
                const ratio = usdValue / token.weight!;

                // Check if this ratio would exceed any balance limits
                const wouldExceedBalance = validTokens.some(otherToken => {
                    if (!otherToken.balance) return false;
                    const requiredAmount = (ratio * otherToken.weight! / otherToken.price!);
                    return requiredAmount > parseFloat(otherToken.balance);
                });

                if (ratio < lowestRatio && !wouldExceedBalance) {
                    lowestRatio = ratio;
                    referenceToken = token;
                }
            }
        });

        if (lowestRatio === Infinity) {
            // If no valid pre-filled amounts, use balance-based calculation
            return tokens.map(token => {
                if (!token.price || !token.weight) return token;

                let optimalAmount: string;
                if (limitingRatio === Infinity) {
                    // No balance constraints - use default value
                    const defaultUsdPerWeight = 1;
                    optimalAmount = ((defaultUsdPerWeight * token.weight) / token.price).toFixed(8);
                } else {
                    // Use balance-constrained amount
                    optimalAmount = ((limitingRatio * token.weight) / token.price).toFixed(8);
                }

                // Final balance check
                if (token.balance) {
                    const maxAmount = parseFloat(token.balance);
                    optimalAmount = Math.min(parseFloat(optimalAmount), maxAmount).toFixed(8);
                }

                return { ...token, amount: optimalAmount };
            });
        }

        // Use the reference token to calculate others, respecting balance limits
        const referenceAmount = parseFloat(referenceToken.amount || '0');
        const referenceUsdValue = referenceAmount * referenceToken.price!;
        const ratioPerWeight = referenceUsdValue / referenceToken.weight!;

        return tokens.map(token => {
            if (!token.price || !token.weight) return token;

            // Calculate optimal amount based on reference
            let optimalAmount = ((ratioPerWeight * token.weight) / token.price).toFixed(8);

            // Respect balance limits
            if (token.balance) {
                const maxAmount = parseFloat(token.balance);
                optimalAmount = Math.min(parseFloat(optimalAmount), maxAmount).toFixed(8);
            }

            return { ...token, amount: optimalAmount };
        });
    }

    // No pre-filled amounts - use balance-based optimization
    return tokens.map(token => {
        if (!token.price || !token.weight) return token;

        let optimalAmount: string;
        if (limitingRatio === Infinity) {
            // No balance constraints - use default value
            const defaultUsdPerWeight = 1;
            optimalAmount = ((defaultUsdPerWeight * token.weight) / token.price).toFixed(8);
        } else {
            // Use balance-constrained amount
            optimalAmount = ((limitingRatio * token.weight) / token.price).toFixed(8);
        }

        // Final balance check
        if (token.balance) {
            const maxAmount = parseFloat(token.balance);
            optimalAmount = Math.min(parseFloat(optimalAmount), maxAmount).toFixed(8);
        }

        return { ...token, amount: optimalAmount };
    });
};

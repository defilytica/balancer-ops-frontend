import { Button, HStack, Stack, useToast } from "@chakra-ui/react";
import { SettingsIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import { PoolConfig, PoolToken, TokenListToken, TokenWithBalance } from "@/types/interfaces";
import { useAccount } from "wagmi";
import { getNetworkString } from "@/lib/utils/getNetworkString";
import { useQuery } from "@apollo/client";
import { CurrentTokenPricesDocument, GqlChain } from "@/lib/services/apollo/generated/graphql";
import { ComposableStableTokenRow } from "./ComposableStableTokenRow";
import { optimizeAmounts } from "@/lib/utils/optimizeTokenAmounts";

interface ComposableStablePoolConfigProps {
  config: PoolConfig;
  onConfigUpdate: (config: PoolToken[]) => void;
  skipCreate: boolean;
}

const defaultRateProvider = "0x0000000000000000000000000000000000000000";

export const ComposableStablePoolConfig = ({
  config,
  onConfigUpdate,
  skipCreate,
}: ComposableStablePoolConfigProps) => {
  const [tokens, setTokens] = useState<TokenWithBalance[]>(
    config.tokens.length
      ? distributeWeights(config.tokens)
      : distributeWeights([
          { address: "", symbol: "", amount: "", weight: 0, rateProvider: "" },
          { address: "", symbol: "", amount: "", weight: 0, rateProvider: "" },
        ]),
  );

  const { chain } = useAccount();
  const toast = useToast();
  const selectedNetwork = getNetworkString(chain?.id);
  const [previousNetwork, setPreviousNetwork] = useState<string | undefined>(selectedNetwork);

  // Helper function to distribute weights evenly
  function distributeWeights(tokens: TokenWithBalance[]): TokenWithBalance[] {
    const weight = 100 / tokens.length; // Calculate weight as percentage
    return tokens.map(token => ({
      ...token,
      weight,
    }));
  }

  // Network change effect
  useEffect(() => {
    if (previousNetwork && selectedNetwork !== previousNetwork) {
      setTokens(
        distributeWeights([
          { address: "", symbol: "", amount: "", weight: 0, rateProvider: "" },
          { address: "", symbol: "", amount: "", weight: 0, rateProvider: "" },
        ]),
      );
      toast({
        title: "Network Changed",
        description: "Token selection has been reset for the new network",
        status: "info",
      });
    }
    setPreviousNetwork(selectedNetwork);
  }, [selectedNetwork, previousNetwork, toast]);

  // Fetch token prices
  const { data: priceData } = useQuery(CurrentTokenPricesDocument, {
    variables: { chains: [selectedNetwork as GqlChain] },
    skip: !selectedNetwork,
    context: {
      uri:
        selectedNetwork === "SEPOLIA"
          ? "https://test-api-v3.balancer.fi/"
          : "https://api-v3.balancer.fi/",
    },
  });

  useEffect(() => {
    if (priceData?.tokenGetCurrentPrices) {
      setTokens(currentTokens => {
        const updatedTokens = currentTokens.map(token => {
          if (!token.address) return token;

          const priceInfo = priceData.tokenGetCurrentPrices.find(
            p => p.address.toLowerCase() === token.address.toLowerCase(),
          );

          if (priceInfo) {
            return {
              ...token,
              price: priceInfo.price,
            };
          }
          return token;
        });

        return distributeWeights(updatedTokens);
      });
    }
  }, [priceData?.tokenGetCurrentPrices]);

  useEffect(() => {
    onConfigUpdate(tokens);
  }, [tokens, onConfigUpdate]);

  const addToken = () => {
    if (tokens.length >= 5) {
      toast({
        title: "Maximum tokens reached",
        description: "A composable stable pool can have a maximum of 5 tokens",
        status: "warning",
      });
      return;
    }
    const newTokens = [
      ...tokens,
      {
        address: "",
        symbol: "",
        amount: "",
        weight: 0,
        rateProvider: defaultRateProvider,
      },
    ];
    setTokens(distributeWeights(newTokens));
  };

  const removeToken = (index: number) => {
    if (tokens.length <= 2) {
      toast({
        title: "Cannot remove token",
        description: "Pool must have at least two tokens",
        status: "warning",
      });
      return;
    }
    const newTokens = tokens.filter((_, i) => i !== index);
    setTokens(distributeWeights(newTokens));
  };

  const handleTokenSelect = (index: number, selectedToken: TokenListToken) => {
    const newTokens = tokens.map((token, i) => {
      if (i === index) {
        const priceInfo = priceData?.tokenGetCurrentPrices?.find(
          p => p.address.toLowerCase() === selectedToken.address.toLowerCase(),
        );

        return {
          ...token,
          address: selectedToken.address,
          symbol: selectedToken.symbol,
          decimals: selectedToken.decimals,
          logoURI: selectedToken.logoURI,
          name: selectedToken.name,
          price: priceInfo?.price,
        };
      }
      return token;
    });
    setTokens(distributeWeights(newTokens));
  };

  const handleAmountChange = (index: number, amount: string) => {
    const newTokens = tokens.map((token, i) => {
      if (i === index) {
        return { ...token, amount };
      }
      return token;
    });
    setTokens(newTokens); // No need to redistribute weights here
  };

  const handleRateProviderChange = (index: number, rateProvider: string) => {
    const newTokens = tokens.map((token, i) => {
      if (i === index) {
        const newRateProvider =
          rateProvider === "" || rateProvider.match(/^0x[a-fA-F0-9]{40}$/)
            ? rateProvider
            : token.rateProvider;
        return { ...token, rateProvider: newRateProvider };
      }
      return token;
    });
    setTokens(newTokens);
  };

  const handleSetDefaultRateProvider = (index: number) => {
    const newTokens = tokens.map((token, i) => {
      if (i === index) {
        return { ...token, rateProvider: defaultRateProvider };
      }
      return token;
    });
    setTokens(newTokens); // No need to redistribute weights here
    toast({
      title: "Default Rate Provider Set",
      description: "Set to zero address",
      status: "info",
    });
  };

  const handleOptimize = () => {
    const optimizedTokens = optimizeAmounts(tokens);
    setTokens(optimizedTokens); // No need to redistribute weights here
    toast({
      title: "Amounts Optimized",
      description: "Token amounts have been optimized to maintain stable ratios",
      status: "success",
    });
  };

  // We can make the TokenRow weight field read-only since weights are automatically managed
  return (
    <Stack spacing={6}>
      <Stack spacing={4}>
        {tokens.map((token, index) => (
          <ComposableStableTokenRow
            key={index}
            token={token}
            index={index}
            onTokenSelect={handleTokenSelect}
            onAmountChange={handleAmountChange}
            onRateProviderChange={handleRateProviderChange}
            onSetDefaultRateProvider={handleSetDefaultRateProvider}
            onRemove={removeToken}
            showRemove={tokens.length > 2}
            chainId={chain?.id}
            selectedNetwork={selectedNetwork}
            skipCreate={skipCreate}
          />
        ))}
      </Stack>

      <HStack spacing={4}>
        <Button variant="outline" onClick={addToken} isDisabled={tokens.length >= 5 || skipCreate}>
          Add Token
        </Button>
        <Button
          leftIcon={<SettingsIcon />}
          onClick={handleOptimize}
          isDisabled={tokens.length < 2 || !tokens.every(t => t.price && t.address)}
        >
          Optimize Amounts
        </Button>
      </HStack>
    </Stack>
  );
};

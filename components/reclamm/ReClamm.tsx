import React, { useState, useMemo, useEffect } from "react";
import {
  Input,
  Grid,
  GridItem,
  Box,
  Heading,
  Container,
  Button,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text,
  Select,
  Flex,
  FormControl,
  FormLabel
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FaPlay, FaPause } from "react-icons/fa";
import { ReClammChart } from "./ReClammChart";
import {
  calculateLowerMargin,
  calculateOutGivenIn,
  calculatePoolCenteredness,
  calculateUpperMargin,
  calculateBalancesAfterSwapIn,
  recalculateVirtualBalances,
  calculateInvariant,
} from "./ReClammMath";
import { formatTime } from "./Time";
import { toFixedDecimals } from "./ToFixedLib";

const defaultInitialBalanceA = 1000;
const defaultInitialBalanceB = 2000;
const defaultMargin = 10;
const defaultPriceShiftDailyRate = 100;
const defaultSwapAmountIn = 100;
const defaultMinPrice = 0.5;
const defaultMaxPrice = 8;
const defaultTargetPrice = 2;
const defaultMaxBalanceA = 3000;

const tickMilliseconds = 10;

const MIN_SWAP = 0.000001;

const NETWORKS = [
  {
    name: "Base",
    network: "base-mainnet",
  },
  {
    name: "Ethereum",
    network: "eth-mainnet",
  },
  {
    name: "Sepolia",
    network: "eth-sepolia",
  },
  {
    name: "OP Mainnet",
    network: "opt-mainnet",
  },
  {
    name: "Arbitrum",
    network: "arb-mainnet",
  },
  {
    name: "Gnosis",
    network: "gnosis-mainnet",
  },
  {
    name: "Avalanche",
    network: "avax-mainnet",
  },
  {
    name: "Sonic",
    network: "sonic-mainnet",
  },
];

export default function ReClamm() {
  // Simulation variables
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationSeconds, setSimulationSeconds] = useState(0);
  const [simulationSecondsLastTick, setSimulationSecondsLastTick] = useState(1);
  const [blockNumber, setBlockNumber] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isPoolInRange, setIsPoolInRange] = useState(true);
  const [outOfRangeTime, setOutOfRangeTime] = useState(0);
  const [lastRangeCheckTime, setLastRangeCheckTime] = useState(0);

  // Initial Variables
  const [initialBalanceA, setInitialBalanceA] = useState(
    defaultInitialBalanceA
  );
  const [initialBalanceB, setInitialBalanceB] = useState(
    defaultInitialBalanceB
  );
  const [initialInvariant, setInitialInvariant] = useState(0);
  const [minPrice, setMinPrice] = useState(defaultMinPrice);
  const [maxPrice, setMaxPrice] = useState(defaultMaxPrice);
  const [targetPrice, setTargetPrice] = useState(defaultTargetPrice);

  // Pool Variables
  const [priceRatio, setPriceRatio] = useState(
    defaultMaxPrice / defaultMinPrice
  );
  const [margin, setMargin] = useState(defaultMargin);
  const [priceShiftDailyRate, setPriceShiftDailyRate] = useState(
    defaultPriceShiftDailyRate
  );

  // Input Variables
  const [inputBalanceA, setInputBalanceA] = useState(
    defaultInitialBalanceA
  );
  const [inputMargin, setInputMargin] = useState(defaultMargin);
  const [inputMinPrice, setInputMinPrice] = useState(defaultMinPrice);
  const [inputMaxPrice, setInputMaxPrice] = useState(defaultMaxPrice);
  const [inputTargetPrice, setInputTargetPrice] = useState(defaultTargetPrice);
  const [inputTargetPriceRatio, setInputTargetPriceRatio] = useState(defaultTargetPrice);

  const [realTimeBalanceA, setRealTimeBalanceA] = useState(
    defaultInitialBalanceA
  );
  const [realTimeBalanceB, setRealTimeBalanceB] = useState(
    defaultInitialBalanceB
  );
  const [realTimeVirtualBalances, setRealTimeVirtualBalances] = useState({
    virtualBalanceA: 0,
    virtualBalanceB: 0,
  });

  // Swap variables
  const [swapTokenIn, setSwapTokenIn] = useState("Token A");
  const [swapAmountIn, setSwapAmountIn] = useState(defaultSwapAmountIn);

  // Price Ratio Variables
  const [startPriceRatio, setStartPriceRatio] = useState(
    defaultMaxPrice / defaultMinPrice
  );
  const [targetPriceRatio, setTargetPriceRatio] = useState(
    defaultMaxPrice / defaultMinPrice
  );
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [inputEndTime, setInputEndTime] = useState(0);

  // Add new state variables for inputs
  const [inputSecondsPerBlock, setInputSecondsPerBlock] = useState(12);

  // Replace the constants with state variables
  const [simulationSecondsPerBlock, setSimulationSecondsPerBlock] = useState(12);

  // Add new state for error message
  const [endTimeError, setEndTimeError] = useState("");

  const [currentBalanceA, setCurrentBalanceA] = useState(
    defaultInitialBalanceA
  );
  const [currentBalanceB, setCurrentBalanceB] = useState(
    defaultInitialBalanceB
  );
  const [currentVirtualBalances, setCurrentVirtualBalances] = useState({
    virtualBalanceA: 0,
    virtualBalanceB: 0,
  });
  const [currentInvariant, setCurrentInvariant] = useState(0);
  const [lastSwapTime, setLastSwapTime] = useState(0);

  const [targetPriceRatioError, setTargetPriceRatioError] = useState("");

  const [network, setNetwork] = useState("base-mainnet");
  const [address, setAddress] = useState(
    "0x7dc81fb7e93cdde7754bff7f55428226bd9cef7b"
  );

  // Add new state for LP fee percentage
  const [lpFeePercent, setLpFeePercent] = useState(0.25);

  const realTimeInvariant = useMemo(() => {
    return (
      (realTimeBalanceA + realTimeVirtualBalances.virtualBalanceA) *
      (realTimeBalanceB + realTimeVirtualBalances.virtualBalanceB)
    );
  }, [realTimeBalanceA, realTimeBalanceB, realTimeVirtualBalances]);

  const poolCenteredness = useMemo(() => {
    return calculatePoolCenteredness({
      balanceA: realTimeBalanceA,
      balanceB: realTimeBalanceB,
      virtualBalanceA: realTimeVirtualBalances.virtualBalanceA,
      virtualBalanceB: realTimeVirtualBalances.virtualBalanceB,
    });
  }, [realTimeBalanceA, realTimeBalanceB, realTimeVirtualBalances]);

  const lowerMargin = useMemo(() => {
    return calculateLowerMargin({
      margin: margin,
      invariant: realTimeInvariant,
      virtualBalanceA: realTimeVirtualBalances.virtualBalanceA,
      virtualBalanceB: realTimeVirtualBalances.virtualBalanceB,
    });
  }, [margin, realTimeVirtualBalances, realTimeInvariant]);

  const higherMargin = useMemo(() => {
    return calculateUpperMargin({
      margin: margin,
      invariant: realTimeInvariant,
      virtualBalanceA: realTimeVirtualBalances.virtualBalanceA,
      virtualBalanceB: realTimeVirtualBalances.virtualBalanceB,
    });
  }, [margin, realTimeVirtualBalances, realTimeInvariant]);

  const calculatedSwapAmountOut = useMemo(() => {
    const amountOut = calculateOutGivenIn({
      balanceA: realTimeBalanceA,
      balanceB: realTimeBalanceB,
      virtualBalanceA: realTimeVirtualBalances.virtualBalanceA,
      virtualBalanceB: realTimeVirtualBalances.virtualBalanceB,
      swapAmountIn: (1 - lpFeePercent / 100) * swapAmountIn,
      swapTokenIn: swapTokenIn,
    });

    // Check if amount out exceeds available balance
    const relevantBalance =
      swapTokenIn === "Token A"
        ? realTimeBalanceB - MIN_SWAP
        : realTimeBalanceA - MIN_SWAP;
    return {
      amount: amountOut,
      exceedsBalance: amountOut > relevantBalance,
    };
  }, [
    swapAmountIn,
    swapTokenIn,
    realTimeBalanceA,
    realTimeBalanceB,
    realTimeVirtualBalances,
    lpFeePercent,
  ]);

  const inputPriceRatio = useMemo(() => {
    return inputMaxPrice / inputMinPrice;
  }, [inputMaxPrice, inputMinPrice]);

  const idealVirtualBalanceA = useMemo(() => {
    return defaultMaxBalanceA / (Math.sqrt(inputPriceRatio) - 1);
  }, [inputPriceRatio]);

  const idealVirtualBalanceB = useMemo(() => {
    return inputMinPrice * (defaultMaxBalanceA + idealVirtualBalanceA);
  }, [idealVirtualBalanceA, inputMinPrice]);

  const idealBalanceB = useMemo(() => {
    return (
      Math.sqrt(
        inputTargetPrice *
          (defaultMaxBalanceA + idealVirtualBalanceA) *
          idealVirtualBalanceB
      ) - idealVirtualBalanceB
    );
  }, [inputTargetPrice, idealVirtualBalanceA, idealVirtualBalanceB]);

  const idealBalanceA = useMemo(() => {
    return (
      (idealBalanceB +
        idealVirtualBalanceB -
        idealVirtualBalanceA * inputTargetPrice) /
      inputTargetPrice
    );
  }, [
    idealBalanceB,
    idealVirtualBalanceB,
    idealVirtualBalanceA,
    inputTargetPrice,
  ]);

  const inputMaxBalanceA = useMemo(() => {
    return (inputBalanceA / idealBalanceA) * defaultMaxBalanceA;
  }, [idealBalanceA, inputBalanceA]);

  const inputVirtualBalanceA = useMemo(() => {
    return inputMaxBalanceA / (Math.sqrt(inputPriceRatio) - 1);
  }, [inputMaxBalanceA, inputPriceRatio]);

  const inputVirtualBalanceB = useMemo(() => {
    return inputMinPrice * (inputMaxBalanceA + inputVirtualBalanceA);
  }, [inputVirtualBalanceA, inputMinPrice, inputMaxBalanceA]);

  const inputBalanceB = useMemo(() => {
    return (inputBalanceA * idealBalanceB) / idealBalanceA;
  }, [inputBalanceA, idealBalanceB, idealBalanceA]);

  // Start default scenario and show chart.
  useEffect(() => {
    setTimeout(() => {
      setCurrentVirtualBalances({
        virtualBalanceA: inputVirtualBalanceA,
        virtualBalanceB: inputVirtualBalanceB,
      });
      setRealTimeVirtualBalances({
        virtualBalanceA: inputVirtualBalanceA,
        virtualBalanceB: inputVirtualBalanceB,
      });
      initializeInvariants(
        inputBalanceA,
        initialBalanceB,
        inputVirtualBalanceA,
        inputVirtualBalanceB
      );
    }, 1);
  }, []);

  useEffect(() => {
    let intervalId:any;

    if (isPlaying) {
      intervalId = setInterval(() => {
        setSimulationSeconds(
          (prev) => prev + speedMultiplier / (1000 / tickMilliseconds)
        );
      }, tickMilliseconds);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, speedMultiplier, tickMilliseconds]);

  useEffect(() => {
    // Update values once every block.
    if (
      simulationSecondsLastTick % simulationSecondsPerBlock <
        simulationSeconds % simulationSecondsPerBlock ||
      !isPlaying
    ) {
      setSimulationSecondsLastTick(simulationSeconds);
      return;
    }
    setSimulationSecondsLastTick(simulationSeconds);
    setBlockNumber((prev) => prev + 1);

    console.log({
      balanceA: realTimeBalanceA,
      balanceB: realTimeBalanceB,
      oldVirtualBalanceA: realTimeVirtualBalances.virtualBalanceA,
      oldVirtualBalanceB: realTimeVirtualBalances.virtualBalanceB,
      currentPriceRatio: priceRatio,
      poolParams: {
        margin: margin,
        priceShiftDailyRate: priceShiftDailyRate,
      },
      updateQ0Params: {
        startTime: startTime,
        endTime: endTime,
        startPriceRatio: startPriceRatio,
        targetPriceRatio: targetPriceRatio,
      },
      simulationParams: {
        simulationSeconds: simulationSeconds,
        simulationSecondsPerBlock: simulationSecondsPerBlock,
        secondsSinceLastInteraction: simulationSecondsPerBlock,
      },
    });

    const { newVirtualBalances, newPriceRatio } = recalculateVirtualBalances({
      balanceA: realTimeBalanceA,
      balanceB: realTimeBalanceB,
      oldVirtualBalanceA: realTimeVirtualBalances.virtualBalanceA,
      oldVirtualBalanceB: realTimeVirtualBalances.virtualBalanceB,
      currentPriceRatio: priceRatio,
      poolParams: {
        margin: margin,
        priceShiftDailyRate: priceShiftDailyRate,
      },
      updateQ0Params: {
        startTime: startTime,
        endTime: endTime,
        startPriceRatio: startPriceRatio,
        targetPriceRatio: targetPriceRatio,
      },
      simulationParams: {
        simulationSeconds: simulationSeconds,
        simulationSecondsPerBlock: simulationSecondsPerBlock,
        secondsSinceLastInteraction: simulationSecondsPerBlock,
      },
    });

    setRealTimeVirtualBalances(newVirtualBalances);
    setPriceRatio(newPriceRatio);
  }, [simulationSeconds]);

  useEffect(() => {
    if (poolCenteredness <= margin / 100) {
      if (isPoolInRange) {
        setIsPoolInRange(false);
        setOutOfRangeTime(0);
      } else {
        setOutOfRangeTime(
          (prev) => prev + (simulationSeconds - lastRangeCheckTime)
        );
      }
    } else {
      setIsPoolInRange(true);
    }
    setLastRangeCheckTime(simulationSeconds);
  }, [simulationSeconds, poolCenteredness, margin]);

  const handleInitialization = () => {
    setInitialBalanceA(Number(inputBalanceA));
    setInitialBalanceB(Number(inputBalanceB));
    setCurrentBalanceA(Number(inputBalanceA));
    setCurrentBalanceB(Number(inputBalanceB));
    setRealTimeBalanceA(Number(inputBalanceA));
    setRealTimeBalanceB(Number(inputBalanceB));
    setCurrentVirtualBalances({
      virtualBalanceA: Number(inputVirtualBalanceA),
      virtualBalanceB: Number(inputVirtualBalanceB),
    });
    setRealTimeVirtualBalances({
      virtualBalanceA: Number(inputVirtualBalanceA),
      virtualBalanceB: Number(inputVirtualBalanceB),
    });
    setPriceRatio(Number(inputPriceRatio));
    setStartPriceRatio(Number(inputPriceRatio));
    setTargetPriceRatio(Number(inputPriceRatio));
    setMargin(Number(inputMargin));
    setMinPrice(Number(inputMinPrice));
    setMaxPrice(Number(inputMaxPrice));
    setTargetPrice(Number(inputTargetPrice));
    initializeInvariants(
      inputBalanceA,
      inputBalanceB,
      inputVirtualBalanceA,
      inputVirtualBalanceB
    );
    setSimulationSeconds(0);
    setBlockNumber(0);
  };

  const initializeInvariants = (
    balanceA:number,
    balanceB:number,
    virtualBalanceA:number,
    virtualBalanceB:number
  ) => {
    console.log(
      "initializeInvariants",
      balanceA,
      balanceB,
      virtualBalanceA,
      virtualBalanceB
    );
    setInitialInvariant(
      (balanceA + virtualBalanceA) * (balanceB + virtualBalanceB)
    );
    setCurrentInvariant(
      (balanceA + virtualBalanceA) * (balanceB + virtualBalanceB)
    );
  };

  const handleUpdatePriceRatio = async () => {
    if (inputEndTime < simulationSeconds) {
      setEndTimeError("End time >= Simulation Time");
      return;
    }

    if (inputTargetPriceRatio < 1.1 || inputTargetPriceRatio > 1000) {
      setTargetPriceRatioError(
        "Target price ratio must be between 1.1 and 1000"
      );
      return;
    }

    setEndTimeError("");
    setTargetPriceRatioError("");
    setStartPriceRatio(priceRatio);
    setTargetPriceRatio(inputTargetPriceRatio);
    setStartTime(simulationSeconds);
    setEndTime(inputEndTime);
  };

  const handleSwap = () => {
    handleRealTimeSwap();
    handleCurrentSwap();
  };

  const handleRealTimeSwap = () => {
    const feeAmount = swapAmountIn * (lpFeePercent / 100);
    let newBalanceA = realTimeBalanceA;
    let newBalanceB = realTimeBalanceB;

    if (swapTokenIn === "Token A") {
      newBalanceA += feeAmount;
    } else {
      newBalanceB += feeAmount;
    }

    const result = calculateBalancesAfterSwapIn({
      balanceA: newBalanceA,
      balanceB: newBalanceB,
      virtualBalanceA: realTimeVirtualBalances.virtualBalanceA,
      virtualBalanceB: realTimeVirtualBalances.virtualBalanceB,
      swapAmountIn: swapAmountIn,
      swapTokenIn: swapTokenIn,
    });

    setRealTimeBalanceA(result.newBalanceA);
    setRealTimeBalanceB(result.newBalanceB);

    const { newVirtualBalances: virtualBalancesAfterSwap } =
      recalculateVirtualBalances({
        balanceA: result.newBalanceA,
        balanceB: result.newBalanceB,
        oldVirtualBalanceA: realTimeVirtualBalances.virtualBalanceA,
        oldVirtualBalanceB: realTimeVirtualBalances.virtualBalanceB,
        currentPriceRatio: priceRatio,
        poolParams: {
          margin: margin,
          priceShiftDailyRate: priceShiftDailyRate,
        },
        updateQ0Params: {
          startTime: startTime,
          endTime: endTime,
          startPriceRatio: startPriceRatio,
          targetPriceRatio: targetPriceRatio,
        },
        simulationParams: {
          simulationSeconds: simulationSeconds,
          simulationSecondsPerBlock: simulationSecondsPerBlock,
          secondsSinceLastInteraction: simulationSeconds - lastSwapTime,
        },
      });

    setRealTimeVirtualBalances(virtualBalancesAfterSwap);
  };

  const handleCurrentSwap = () => {
    const { newVirtualBalances } = recalculateVirtualBalances({
      balanceA: currentBalanceA,
      balanceB: currentBalanceB,
      oldVirtualBalanceA: currentVirtualBalances.virtualBalanceA,
      oldVirtualBalanceB: currentVirtualBalances.virtualBalanceB,
      currentPriceRatio: priceRatio,
      poolParams: {
        margin: margin,
        priceShiftDailyRate: priceShiftDailyRate,
      },
      updateQ0Params: {
        startTime: startTime,
        endTime: endTime,
        startPriceRatio: startPriceRatio,
        targetPriceRatio: targetPriceRatio,
      },
      simulationParams: {
        simulationSeconds: simulationSeconds,
        simulationSecondsPerBlock: simulationSecondsPerBlock,
        secondsSinceLastInteraction: simulationSeconds - lastSwapTime,
      },
    });
    setLastSwapTime(simulationSeconds);
    setCurrentVirtualBalances(newVirtualBalances);

    const feeAmount = swapAmountIn * (lpFeePercent / 100);
    let newBalanceA = currentBalanceA;
    let newBalanceB = currentBalanceB;

    if (swapTokenIn === "Token A") {
      newBalanceA += feeAmount;
    } else {
      newBalanceB += feeAmount;
    }

    const result = calculateBalancesAfterSwapIn({
      balanceA: newBalanceA,
      balanceB: newBalanceB,
      virtualBalanceA: newVirtualBalances.virtualBalanceA,
      virtualBalanceB: newVirtualBalances.virtualBalanceB,
      swapAmountIn: swapAmountIn,
      swapTokenIn: swapTokenIn,
    });

    setCurrentBalanceA(result.newBalanceA);
    setCurrentBalanceB(result.newBalanceB);

    const { newVirtualBalances: virtualBalancesAfterSwap } =
      recalculateVirtualBalances({
        balanceA: result.newBalanceA,
        balanceB: result.newBalanceB,
        oldVirtualBalanceA: currentVirtualBalances.virtualBalanceA,
        oldVirtualBalanceB: currentVirtualBalances.virtualBalanceB,
        currentPriceRatio: priceRatio,
        poolParams: {
          margin: margin,
          priceShiftDailyRate: priceShiftDailyRate,
        },
        updateQ0Params: {
          startTime: startTime,
          endTime: endTime,
          startPriceRatio: startPriceRatio,
          targetPriceRatio: targetPriceRatio,
        },
        simulationParams: {
          simulationSeconds: simulationSeconds,
          simulationSecondsPerBlock: simulationSecondsPerBlock,
          secondsSinceLastInteraction: simulationSeconds - lastSwapTime,
        },
      });

    setCurrentVirtualBalances(virtualBalancesAfterSwap);

    setCurrentInvariant(
      calculateInvariant({
        balanceA: result.newBalanceA,
        balanceB: result.newBalanceB,
        virtualBalanceA: virtualBalancesAfterSwap.virtualBalanceA,
        virtualBalanceB: virtualBalancesAfterSwap.virtualBalanceB,
      })
    );
  };

  // Add handler for saving simulation config
  const handleSaveSimulationConfig = () => {
    setSimulationSecondsPerBlock(inputSecondsPerBlock);
  };

  const handleLoadPool = async () => {
    const res = await fetch(
      `${process.env.REACT_APP_FUNCTION_URL}/reclammData?network=${network}&address=${address}`
    );
    const data = await res.json();

    const balanceA = data.realBalances[0] / Math.pow(10, 18);
    const balanceB = data.realBalances[1] / Math.pow(10, 18);
    const virtualBalanceA =
      data.virtualBalances.currentVirtualBalanceA / Math.pow(10, 18);
    const virtualBalanceB =
      data.virtualBalances.currentVirtualBalanceB / Math.pow(10, 18);

    const maxPrice = data.priceRange.maxPrice / Math.pow(10, 18);
    const minPrice = data.priceRange.minPrice / Math.pow(10, 18);

    const priceRatio = maxPrice / minPrice;

    const margin = data.centerednessMargin / Math.pow(10, 16);
    const priceShift = data.dailyPriceShiftExponent / Math.pow(10, 16);

    const targetPrice =
      (balanceB + virtualBalanceB) / (balanceA + virtualBalanceA);

    setInputMaxPrice(maxPrice);
    setInputMinPrice(minPrice);
    setInputTargetPrice(targetPrice);
    setInputMargin(margin);
    setPriceShiftDailyRate(priceShift);

    setInputBalanceA(balanceA);
    setInitialBalanceA(balanceA);
    setInitialBalanceB(balanceB);
    setCurrentBalanceA(balanceA);
    setCurrentBalanceB(balanceB);
    setRealTimeBalanceA(balanceA);
    setRealTimeBalanceB(balanceB);

    setCurrentVirtualBalances({
      virtualBalanceA,
      virtualBalanceB,
    });
    setRealTimeVirtualBalances({
      virtualBalanceA,
      virtualBalanceB,
    });

    setPriceRatio(priceRatio);
    setStartPriceRatio(priceRatio);
    setTargetPriceRatio(priceRatio);
    setMargin(margin);
    setMinPrice(minPrice);
    setMaxPrice(maxPrice);
    initializeInvariants(balanceA, balanceB, virtualBalanceA, virtualBalanceB);
    setSimulationSeconds(0);
    setBlockNumber(0);
  };

  return (
    <Container maxW="container.xl">
      <Grid templateColumns="repeat(12, 1fr)" gap={4}>
        {/* Left Column - Controls */}
        <GridItem colSpan={3}>
          {/* Load Real Pool Section */}
          <Accordion allowToggle>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading size="md">Load Real Pool</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel>
                <Select
                  placeholder="Network"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  mb={4}
                >
                  {NETWORKS.sort((a, b) => a.name.localeCompare(b.name)).map(
                    (n) => (
                      <option key={n.network} value={n.network}>
                        {n.name}
                      </option>
                    )
                  )}
                </Select>
                <Input
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  mb={4}
                />
                <Button
                  colorScheme="blue"
                  width="full"
                  onClick={handleLoadPool}
                  mt={2}
                >
                  Load Pool
                </Button>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          <Accordion allowToggle mt={4}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading size="md">Create and Initialize</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel>
                <Text fontWeight="bold" mb={2}>
                  Create Parameters
                </Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                  <GridItem>
                <FormControl variant="floating">
                  <FormLabel>Minimum Price</FormLabel>                    
                    <Input
                      placeholder="Minimum Price"
                      type="number"
                      value={inputMinPrice}
                      onChange={(e) => setInputMinPrice(Number(e.target.value))}
                      mb={2}
                    />
                  </FormControl>
                  </GridItem>
                  <GridItem>
                  <FormControl variant="floating">
                  <FormLabel>Maximum Price</FormLabel>                       
                    <Input
                      placeholder="Maximum Price"
                      type="number"
                      value={inputMaxPrice}
                      onChange={(e) => setInputMaxPrice(Number(e.target.value))}
                      mb={2}
                    />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                  <FormControl variant="floating">
                  <FormLabel>Target Price</FormLabel>   
                    <Input
                      placeholder="Target Price"
                      type="number"
                      value={inputTargetPrice}
                      onChange={(e) => setInputTargetPrice(Number(e.target.value))}
                      mb={2}
                    />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                  <FormControl variant="floating">
                  <FormLabel>Margin %</FormLabel>                       
                    <Input
                      placeholder="Margin (%)"
                      type="number"
                      value={inputMargin}
                      onChange={(e) => setInputMargin(Number(e.target.value))}
                      mb={2}
                    />
                    </FormControl>
                  </GridItem>
                </Grid>
                <FormControl variant="floating">
                <FormLabel>Price Shift Daily Rate %</FormLabel>   
                <Input
                  placeholder="Price Shift Daily Rate (%)"
                  type="number"
                  value={priceShiftDailyRate}
                  onChange={(e) => setPriceShiftDailyRate(Number(e.target.value))}
                  mb={4}
                />
                </FormControl>
                <Text fontWeight="bold" mb={2}>
                  Initial Balance A
                </Text>
                <Input
                  placeholder="Initial Balance A"
                  type="number"
                  value={inputBalanceA}
                  onChange={(e) => setInputBalanceA(Number(e.target.value))}
                  mb={4}
                />

                <Flex justify="space-between" mb={1}>
                  <Text>Ideal Proportion:</Text>
                  <Text>{toFixedDecimals(idealBalanceB / idealBalanceA)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Initial Balance B:</Text>
                  <Text>{toFixedDecimals(inputBalanceB)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Virtual Balance A:</Text>
                  <Text>{toFixedDecimals(inputVirtualBalanceA)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Virtual Balance B:</Text>
                  <Text>{toFixedDecimals(inputVirtualBalanceB)}</Text>
                </Flex>
                
                <Button
                  width="full"
                  onClick={handleInitialization}
                  isDisabled={
                    Math.abs(
                      inputBalanceB /
                        inputBalanceA /
                        (idealBalanceB / idealBalanceA) -
                        1
                    ) >= 0.01
                  }
                  mt={3}
                >
                  Create and Initialize
                </Button>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          <Accordion allowToggle mt={4}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading size="md">Swap Exact In</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel>
                <Select 
                  value={swapTokenIn}
                  onChange={(e) => setSwapTokenIn(e.target.value)}
                  mb={4}
                >
                  <option value="Token A">Token A</option>
                  <option value="Token B">Token B</option>
                </Select>
                <FormControl variant="floating">
                  <FormLabel>Amount In</FormLabel> 
                <Input
                  placeholder="Amount In"
                  type="number"
                  value={swapAmountIn}
                  onChange={(e) => setSwapAmountIn(Number(e.target.value))}
                  mb={4}
                />
                </FormControl>
                <FormControl variant="floating">
                  <FormLabel>LP Fee %</FormLabel>                 
                <Input
                  placeholder="LP Fee %"
                  type="number"
                  value={lpFeePercent}
                  onChange={(e) => setLpFeePercent(Number(e.target.value))}
                  mb={4}
                />
                </FormControl>
                <Text
                  mb={3}
                  color={calculatedSwapAmountOut.exceedsBalance ? "#2dce89" : "inherit"}
                >
                  Amount Out {swapTokenIn === "Token A" ? "B" : "A"}:{" "}
                  {calculatedSwapAmountOut.amount > 0
                    ? toFixedDecimals(calculatedSwapAmountOut.amount)
                    : "0"}
                  {calculatedSwapAmountOut.exceedsBalance && (
                    <Text fontSize="sm" mt={1}>
                      Token {swapTokenIn === "Token A" ? "B" : "A"} Amount in the
                      pool must be at least {MIN_SWAP}.
                    </Text>
                  )}
                </Text>
                
                <Button
                  colorScheme="blue"
                  width="full"
                  onClick={handleSwap}
                  isDisabled={calculatedSwapAmountOut.exceedsBalance}
                >
                  Swap
                </Button>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          <Accordion allowToggle mt={4}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading size="md">Update Price Ratio</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel>
              <FormControl variant="floating">
              <FormLabel>Target Price Ratio</FormLabel> 
                <Input
                  placeholder="Target Price Ratio"
                  type="number"
                  value={inputTargetPriceRatio}
                  onChange={(e) => setInputTargetPriceRatio(Number(e.target.value))}
                  isInvalid={!!targetPriceRatioError}
                  mb={targetPriceRatioError ? 1 : 4}
                />
                </FormControl>
                {targetPriceRatioError && (
                  <Text color="#2dce89" fontSize="sm" mb={3}>
                    {targetPriceRatioError}
                  </Text>
                )}

                <Text mb={2}>
                  Current Time: {simulationSeconds.toFixed(0)}
                </Text>
                <FormControl variant="floating">
                  <FormLabel>End Time In Seconds</FormLabel>                 
                <Input
                  placeholder="End Time (in seconds)"
                  type="number"
                  value={inputEndTime}
                  onChange={(e) => setInputEndTime(Number(e.target.value))}
                  isInvalid={!!endTimeError}
                  mb={endTimeError ? 1 : 4}
                />
                </FormControl>
                {endTimeError && (
                  <Text color="#2dce89" fontSize="sm" mb={3}>
                    {endTimeError}
                  </Text>
                )}
                
                <Button
                  colorScheme="blue"
                  width="full"
                  onClick={handleUpdatePriceRatio}
                >
                  Update Price Ratio
                </Button>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          <Accordion allowToggle mt={4}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading size="md">Simulation Parameters</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel>
              <FormControl variant="floating">
              <FormLabel>Seconds per Block</FormLabel> 
                <Input
                  placeholder="Seconds Per Block"
                  type="number"
                  value={inputSecondsPerBlock}
                  onChange={(e) => setInputSecondsPerBlock(Number(e.target.value))}
                  mb={4}
                />
                </FormControl>
                <Button
                  colorScheme="blue"
                  width="full"
                  onClick={handleSaveSimulationConfig}
                >
                  Save Config
                </Button>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </GridItem>

        {/* Middle Column - Chart */}
        <GridItem colSpan={6}>
          <Box p={4} borderRadius="md" boxShadow="md" textAlign="center">
            <Box width="100%" height="600px">
              <ReClammChart
                realTimeBalanceA={realTimeBalanceA}
                realTimeBalanceB={realTimeBalanceB}
                realTimeVirtualBalances={realTimeVirtualBalances}
                realTimeInvariant={realTimeInvariant}
                initialInvariant={initialInvariant}
                margin={margin}
                currentBalanceA={currentBalanceA}
                currentBalanceB={currentBalanceB}
                currentVirtualBalances={currentVirtualBalances}
                currentInvariant={currentInvariant}
              />
            </Box>
          </Box>
          
          <Box p={4} borderRadius="md" boxShadow="md" mt={4}>
            <Flex align="center" gap={4} mb={4}>
              <Button
                colorScheme={isPlaying ? "#2dce89" : "green"}
                onClick={() => setIsPlaying(!isPlaying)}
                leftIcon={isPlaying ? <FaPause /> : <FaPlay />}
              >
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Text
                fontWeight="bold"
                color={isPlaying ? "green.500" : "#2dce89"}
              >
                {isPlaying ? "Running" : "Paused"} - Simulation time:{" "}
                {formatTime(simulationSeconds)} - Block: {blockNumber}
              </Text>
            </Flex>
            
            <Flex gap={2} wrap="wrap">
              {[1, 10, 100, 1000].map((speed) => (
                <Button
                  key={speed}
                  variant={speedMultiplier === speed ? "solid" : "outline"}
                  colorScheme="blue"
                  onClick={() => setSpeedMultiplier(speed)}
                  flex="1"
                >
                  {speed}x
                </Button>
              ))}
            </Flex>
          </Box>
        </GridItem>
        {/* Right Column - Current Values */}
        <GridItem colSpan={3}>
          <Accordion allowToggle defaultIndex={[0, 1, 2, 3]}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading size="md">Current Pool State</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel>
                <Flex justify="space-between" mb={1}>
                  <Text>Invariant:</Text>
                  <Text>{toFixedDecimals(currentInvariant)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Current Balance A:</Text>
                  <Text>{toFixedDecimals(currentBalanceA)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Current Balance B:</Text>
                  <Text>{toFixedDecimals(currentBalanceB)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Virtual Balance A:</Text>
                  <Text>{toFixedDecimals(currentVirtualBalances.virtualBalanceA)}</Text>
                </Flex>
                <Flex justify="space-between" mb={3}>
                  <Text>Virtual Balance B:</Text>
                  <Text>{toFixedDecimals(currentVirtualBalances.virtualBalanceB)}</Text>
                </Flex>
                
                <Box mt={4}>
                  <Flex justify="space-between" mb={1}>
                    <Text>Rate Max/Min:</Text>
                    <Text>
                      {toFixedDecimals(
                        Math.pow(currentInvariant, 2) /
                          (Math.pow(currentVirtualBalances.virtualBalanceA, 2) *
                            Math.pow(currentVirtualBalances.virtualBalanceB, 2))
                      )}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text color="red.500">Min Price A:</Text>
                    <Text color="red.500">
                      {toFixedDecimals(
                        Math.pow(currentVirtualBalances.virtualBalanceB, 2) /
                          currentInvariant
                      )}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text color="blue.500">Lower Margin Price A:</Text>
                    <Text color="blue.500">
                      {toFixedDecimals(
                        currentInvariant / Math.pow(higherMargin, 2)
                      )}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text color="green.500">Current Price A:</Text>
                    <Text color="green.500">
                      {toFixedDecimals(
                        (currentBalanceB + currentVirtualBalances.virtualBalanceB) /
                          (currentBalanceA + currentVirtualBalances.virtualBalanceA)
                      )}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text color="blue.500">Upper Margin Price A:</Text>
                    <Text color="blue.500">
                      {toFixedDecimals(
                        currentInvariant / Math.pow(lowerMargin, 2)
                      )}
                    </Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="red.500">Max Price A:</Text>
                    <Text color="red.500">
                      {toFixedDecimals(
                        currentInvariant /
                          Math.pow(currentVirtualBalances.virtualBalanceA, 2)
                      )}
                    </Text>
                  </Flex>
                </Box>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          <Accordion allowToggle defaultIndex={[0]} mt={4}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading size="md">Real-Time Pool State</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel>
                <Flex justify="space-between" mb={1}>
                  <Text>Invariant:</Text>
                  <Text>{toFixedDecimals(realTimeInvariant)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Current Balance A:</Text>
                  <Text>{toFixedDecimals(realTimeBalanceA)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Current Balance B:</Text>
                  <Text>{toFixedDecimals(realTimeBalanceB)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Virtual Balance A:</Text>
                  <Text>{toFixedDecimals(realTimeVirtualBalances.virtualBalanceA)}</Text>
                </Flex>
                <Flex justify="space-between" mb={3}>
                  <Text>Virtual Balance B:</Text>
                  <Text>{toFixedDecimals(realTimeVirtualBalances.virtualBalanceB)}</Text>
                </Flex>
                
                <Box mt={4}>
                  <Flex justify="space-between" mb={1}>
                    <Text>Rate Max/Min:</Text>
                    <Text>
                      {toFixedDecimals(
                        Math.pow(realTimeInvariant, 2) /
                          (Math.pow(realTimeVirtualBalances.virtualBalanceA, 2) *
                            Math.pow(realTimeVirtualBalances.virtualBalanceB, 2))
                      )}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text color="red.500">Min Price A:</Text>
                    <Text color="red.500">
                      {toFixedDecimals(
                        Math.pow(realTimeVirtualBalances.virtualBalanceB, 2) /
                          realTimeInvariant
                      )}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text color="blue.500">Lower Margin Price A:</Text>
                    <Text color="blue.500">
                      {toFixedDecimals(
                        realTimeInvariant / Math.pow(higherMargin, 2)
                      )}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text color="green.500">Current Price A:</Text>
                    <Text color="green.500">
                      {toFixedDecimals(
                        (realTimeBalanceB + realTimeVirtualBalances.virtualBalanceB) /
                          (realTimeBalanceA + realTimeVirtualBalances.virtualBalanceA)
                      )}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text color="blue.500">Upper Margin Price A:</Text>
                    <Text color="blue.500">
                      {toFixedDecimals(
                        realTimeInvariant / Math.pow(lowerMargin, 2)
                      )}
                    </Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="red.500">Max Price A:</Text>
                    <Text color="red.500">
                      {toFixedDecimals(
                        realTimeInvariant /
                          Math.pow(realTimeVirtualBalances.virtualBalanceA, 2)
                      )}
                    </Text>
                  </Flex>
                </Box>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          <Accordion allowToggle defaultIndex={[0]} mt={4}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading size="md">Price Ratio</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel>
                {simulationSeconds < endTime ? (
                  <>
                    <Text color="green.500" fontWeight="bold" mb={2}>
                      UPDATING RANGE
                    </Text>
                    <Flex justify="space-between" mb={1} ml={4}>
                      <Text>Start Price Ratio:</Text>
                      <Text>{toFixedDecimals(startPriceRatio)}</Text>
                    </Flex>
                    <Flex justify="space-between" mb={1} ml={4}>
                      <Text>Current Price Ratio:</Text>
                      <Text>{toFixedDecimals(priceRatio)}</Text>
                    </Flex>
                    <Flex justify="space-between" mb={1} ml={4}>
                      <Text>Target Price Ratio:</Text>
                      <Text>{toFixedDecimals(targetPriceRatio)}</Text>
                    </Flex>
                    <Flex justify="space-between" mb={3} ml={4}>
                      <Text>End Time (s):</Text>
                      <Text>{endTime}</Text>
                    </Flex>
                  </>
                ) : (
                  <Flex justify="space-between" mb={3}>
                    <Text>Current Price Ratio:</Text>
                    <Text>{toFixedDecimals(priceRatio)}</Text>
                  </Flex>
                )}
                
                <Flex justify="space-between" mb={1}>
                  <Text>Pool Centeredness:</Text>
                  <Text>{toFixedDecimals(poolCenteredness)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Status:</Text>
                  <Text
                    color={poolCenteredness > margin / 100 ? "green.500" : "red.500"}
                    fontWeight="bold"
                  >
                    {poolCenteredness > margin / 100 ? "IN RANGE" : "OUT OF RANGE"}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text>Out of Range time:</Text>
                  <Text>{formatTime(outOfRangeTime)}</Text>
                </Flex>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          <Accordion allowToggle defaultIndex={[0]} mt={4}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading size="md">Initial Values</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel>
                <Flex justify="space-between" mb={1}>
                  <Text>Initial Balance A:</Text>
                  <Text>{toFixedDecimals(initialBalanceA)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Initial Balance B:</Text>
                  <Text>{toFixedDecimals(initialBalanceB)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Min Price A:</Text>
                  <Text>{toFixedDecimals(minPrice)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Target Price A:</Text>
                  <Text>{toFixedDecimals(targetPrice)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Max Price A:</Text>
                  <Text>{toFixedDecimals(maxPrice)}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Price Ratio:</Text>
                  <Text>{toFixedDecimals(priceRatio)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text>Margin:</Text>
                  <Text>{toFixedDecimals(margin)}%</Text>
                </Flex>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </GridItem>
        </Grid>
    </Container>
  );
}
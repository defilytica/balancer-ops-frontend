import React, { useState, useMemo, useEffect } from "react";
import {
  Input,
  Grid,
  GridItem,
  Box,
  Text,
  Container,
  Button,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Flex,
  Select,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Badge,
  HStack,
  VStack,
  Icon,
  Tooltip,
  Progress,
  ButtonGroup,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { ChevronDownIcon, TriangleDownIcon, InfoIcon } from "@chakra-ui/icons";
import { FaPlay, FaPause, FaFastForward, FaStepForward, FaRedo } from "react-icons/fa";
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
  const [initialBalanceA, setInitialBalanceA] = useState(defaultInitialBalanceA);
  const [initialBalanceB, setInitialBalanceB] = useState(defaultInitialBalanceB);
  const [initialInvariant, setInitialInvariant] = useState(0);
  const [minPrice, setMinPrice] = useState(defaultMinPrice);
  const [maxPrice, setMaxPrice] = useState(defaultMaxPrice);
  const [targetPrice, setTargetPrice] = useState(defaultTargetPrice);

  // Pool Variables
  const [priceRatio, setPriceRatio] = useState(defaultMaxPrice / defaultMinPrice);
  const [margin, setMargin] = useState(defaultMargin);
  const [priceShiftDailyRate, setPriceShiftDailyRate] = useState(defaultPriceShiftDailyRate);

  // Input Variables
  const [inputBalanceA, setInputBalanceA] = useState(defaultInitialBalanceA);
  const [inputMargin, setInputMargin] = useState(defaultMargin);
  const [inputMinPrice, setInputMinPrice] = useState(defaultMinPrice);
  const [inputMaxPrice, setInputMaxPrice] = useState(defaultMaxPrice);
  const [inputTargetPrice, setInputTargetPrice] = useState(defaultTargetPrice);

  const [inputTargetPriceRatio, setInputTargetPriceRatio] = useState(defaultTargetPrice);

  const [realTimeBalanceA, setRealTimeBalanceA] = useState(defaultInitialBalanceA);
  const [realTimeBalanceB, setRealTimeBalanceB] = useState(defaultInitialBalanceB);
  const [realTimeVirtualBalances, setRealTimeVirtualBalances] = useState({
    virtualBalanceA: 0,
    virtualBalanceB: 0,
  });

  // Swap variables
  const [swapTokenIn, setSwapTokenIn] = useState("Token A");
  const [swapAmountIn, setSwapAmountIn] = useState(defaultSwapAmountIn);

  // Price Ratio Variables
  const [startPriceRatio, setStartPriceRatio] = useState(defaultMaxPrice / defaultMinPrice);
  const [targetPriceRatio, setTargetPriceRatio] = useState(defaultMaxPrice / defaultMinPrice);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const [inputEndTime, setInputEndTime] = useState(0);

  // Add new state variables for inputs
  const [inputSecondsPerBlock, setInputSecondsPerBlock] = useState(12);

  // Replace the constants with state variables
  const [simulationSecondsPerBlock, setSimulationSecondsPerBlock] = useState(12);

  // Add new state for error message
  const [endTimeError, setEndTimeError] = useState("");

  const [currentBalanceA, setCurrentBalanceA] = useState(defaultInitialBalanceA);
  const [currentBalanceB, setCurrentBalanceB] = useState(defaultInitialBalanceB);
  const [currentVirtualBalances, setCurrentVirtualBalances] = useState({
    virtualBalanceA: 0,
    virtualBalanceB: 0,
  });
  const [currentInvariant, setCurrentInvariant] = useState(0);
  const [lastSwapTime, setLastSwapTime] = useState(0);

  const [targetPriceRatioError, setTargetPriceRatioError] = useState("");

  const [network, setNetwork] = useState("base-mainnet");
  const [address, setAddress] = useState("0x7dc81fb7e93cdde7754bff7f55428226bd9cef7b");

  // Add new state for LP fee percentage
  const [lpFeePercent, setLpFeePercent] = useState(1);

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
    let intervalId;

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
    balanceA,
    balanceB,
    virtualBalanceA,
    virtualBalanceB
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

  // These are reusable components for property display
  const PropertyRow = ({ label, value, color }) => (
    <Flex justify="space-between">
      <Text color={color}>{label}</Text>
      <Text color={color}>{value}</Text>
    </Flex>
  );

  const resetSimulation = () => {
    setIsPlaying(false);
    setSimulationSeconds(0);
    setBlockNumber(0);
    setRealTimeBalanceA(initialBalanceA);
    setRealTimeBalanceB(initialBalanceB);
    setCurrentBalanceA(initialBalanceA);
    setCurrentBalanceB(initialBalanceB);
    setOutOfRangeTime(0);
    setLastRangeCheckTime(0);
    
    const resetVirtualBalances = {
      virtualBalanceA: inputVirtualBalanceA,
      virtualBalanceB: inputVirtualBalanceB
    };
    
    setRealTimeVirtualBalances(resetVirtualBalances);
    setCurrentVirtualBalances(resetVirtualBalances);
  };

  return (
    <Container maxW="container.xl">
      <Box my={5}>
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">ReClamm Pool Simulator</Text>
        <Text fontSize="md" textAlign="center" color="gray.600">
          Simulate and analyze the behavior of ReClamm automated liquidity pools
        </Text>
      </Box>
      
      <Grid templateColumns="repeat(12, 1fr)" gap={4}>
        {/* Left Column - Controls */}
        <GridItem colSpan={{ base: 12, md: 3 }}>
          <Accordion allowToggle defaultIndex={[0]}>
            {/* Load Real Pool Section */}
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Text fontSize="lg" fontWeight="bold">Load Real Pool</Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <FormControl mb={4}>
                  <FormLabel>Network</FormLabel>
                  <Select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                  >
                    {NETWORKS.sort((a, b) => a.name.localeCompare(b.name)).map(
                      (n) => (
                        <option key={n.network} value={n.network}>
                          {n.name}
                        </option>
                      )
                    )}
                  </Select>
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Address</FormLabel>
                  <Input
                    placeholder="Pool address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </FormControl>
                <Button colorScheme="blue" width="full" onClick={handleLoadPool}>
                  Load Pool
                </Button>
              </AccordionPanel>
            </AccordionItem>

            {/* Create and Initialize */}
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Text fontSize="lg" fontWeight="bold">Create and Initialize</Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Text fontWeight="bold" mb={2}>Create Parameters</Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                  <GridItem>
                    <FormControl mb={3}>
                      <FormLabel>Minimum Price</FormLabel>
                      <Input
                        type="number"
                        value={inputMinPrice}
                        onChange={(e) => setInputMinPrice(Number(e.target.value))}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl mb={3}>
                      <FormLabel>Maximum Price</FormLabel>
                      <Input
                        type="number"
                        value={inputMaxPrice}
                        onChange={(e) => setInputMaxPrice(Number(e.target.value))}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl mb={3}>
                      <FormLabel>Target Price</FormLabel>
                      <Input
                        type="number"
                        value={inputTargetPrice}
                        onChange={(e) => setInputTargetPrice(Number(e.target.value))}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl mb={3}>
                      <FormLabel>Margin (%)</FormLabel>
                      <Input
                        type="number"
                        value={inputMargin}
                        onChange={(e) => setInputMargin(Number(e.target.value))}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>
                <FormControl mb={3}></FormControl>
                <FormLabel>Price Shift Daily Rate %</FormLabel>
                <Input
                  type="number"
                  value={defaultPriceShiftDailyRate}
                  onChange={(e) => (Number(e.target.value))}
                />
                </AccordionPanel>
                </AccordionItem>
                </Accordion>
                </GridItem>
                </Grid>
                </Container>
  )}
import { useState, useMemo } from "react";
import {
  Grid,
  GridItem,
  Box,
  Text,
  Container,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Input,
  Button,
  Select,
  Heading,
  FormLabel,
  FormControl,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tooltip,
} from "@chakra-ui/react";
import { stableInvariant } from "../../lib/utils/StableMath";
import { getTokenBalanceGivenInvariantAndAllOtherBalances } from "../../lib/utils/StableMath";
import { calculateImbalance, getSurgeFeePercentage } from "./StableSurgeHook";
import { StableSurgeChart } from "./StableSurgeChart";

export default function StableSurgeSimulator() {
  const [inputBalances, setInputBalances] = useState<number[]>([1000000, 1000000]);
  const [initialBalances, setInitialBalances] = useState<number[]>([1000, 1000]);
  const [currentBalances, setCurrentBalances] = useState<number[]>([1000, 1000]);
  const [totalFees, setTotalFees] = useState<number[]>([0, 0]);
  const [tokenNames, setTokenNames] = useState<string[]>(["GHO", "USDC", "USDT", "GYD"]);

  const [inputTokenCount, setInputTokenCount] = useState<number>(2);
  const [tokenCount, setTokenCount] = useState<number>(2);
  const [inputAmplification, setInputAmplification] = useState(1);
  const [showAmplificationTooltip, setShowAmplificationTooltip] = useState(false);

  // Define your mark values
  const markValues = [1, 10000, 25000, 50000];

  // Function to handle mark clicks
  const handleMarkClick = (value: number) => {
    setInputAmplification(value);
  };

  const [inputSwapFee, setInputSwapFee] = useState<number>(1);
  const [inputMaxSurgeFee, setInputMaxSurgeFee] = useState<number>(10);
  const [inputSurgeThreshold, setInputSurgeThreshold] = useState<number>(20);

  const [amplification, setAmplification] = useState<number>(100);
  const [swapFee, setSwapFee] = useState<number>(1);
  const [maxSurgeFee, setMaxSurgeFee] = useState<number>(10);
  const [surgeThreshold, setSurgeThreshold] = useState<number>(20);

  const [swapTokenInIndex, setSwapTokenInIndex] = useState(0);
  const [swapTokenOutIndex, setSwapTokenOutIndex] = useState(1);
  const [swapAmountIn, setSwapAmountIn] = useState<number>(0);

  const currentInvariant = useMemo(() => {
    return stableInvariant(amplification, currentBalances);
  }, [amplification, currentBalances]);

  const curvePoints = useMemo(() => {
    const lastBalanceOut = currentBalances[swapTokenOutIndex] / 100;
    let lastBalanceIn = currentBalances[swapTokenInIndex];

    for (let i = 0; i < 1000; i++) {
      const currentIn = (i * currentBalances[swapTokenOutIndex]) / 10;
      const balances = [...currentBalances];
      balances[swapTokenInIndex] = currentIn;
      const currentOut = getTokenBalanceGivenInvariantAndAllOtherBalances(
        amplification,
        balances,
        currentInvariant,
        swapTokenOutIndex,
      );
      if (currentOut < lastBalanceOut) {
        lastBalanceIn = currentIn;
        break;
      }
    }

    const step = lastBalanceIn / 1000;

    return Array.from({ length: 1000 }, (_, i) => {
      const x = (i + 1) * step;
      const balances = [...currentBalances];
      balances[swapTokenInIndex] = x;
      const y = getTokenBalanceGivenInvariantAndAllOtherBalances(
        amplification,
        balances,
        currentInvariant,
        swapTokenOutIndex,
      );

      return { x, y };
    });
  }, [
    swapTokenInIndex,
    swapTokenOutIndex,
    currentBalances[swapTokenInIndex],
    currentBalances[swapTokenOutIndex],
    amplification,
    currentInvariant,
  ]);

  const curvePointsWithFees = useMemo(() => {
    const lastBalanceOut = currentBalances[swapTokenOutIndex] / 100;
    let lastBalanceIn = currentBalances[swapTokenInIndex];

    for (let i = 0; i < 1000; i++) {
      const currentIn = (i * currentBalances[swapTokenOutIndex]) / 10;
      const balances = [...currentBalances];
      balances[swapTokenInIndex] = currentIn;
      const currentOut = getTokenBalanceGivenInvariantAndAllOtherBalances(
        amplification,
        balances,
        currentInvariant,
        swapTokenOutIndex,
      );
      if (currentOut < lastBalanceOut) {
        lastBalanceIn = currentIn;
        break;
      }
    }

    const step = lastBalanceIn / 10000;

    return Array.from({ length: 10000 }, (_, i) => {
      let x = (i + 1) * step;
      const balances = [...currentBalances];
      balances[swapTokenInIndex] = x;
      let y = getTokenBalanceGivenInvariantAndAllOtherBalances(
        amplification,
        balances,
        currentInvariant,
        swapTokenOutIndex,
      );
      const surgeFeePercentage = getSurgeFeePercentage(
        maxSurgeFee,
        surgeThreshold,
        swapFee,
        balances,
        currentBalances,
      );
      if (x < currentBalances[swapTokenInIndex]) {
        // fee on B
        const swapAmountIn = y - currentBalances[swapTokenOutIndex];
        const fee = (swapAmountIn * surgeFeePercentage) / 100;
        y = y + fee; // Give fees back to the pool.
      } else {
        // fee on A
        const swapAmountIn = x - currentBalances[swapTokenInIndex];
        const fee = (swapAmountIn * surgeFeePercentage) / 100;
        x = x + fee; // Give fees back to the pool.
      }

      return { x, y };
    });
  }, [
    swapTokenInIndex,
    swapTokenOutIndex,
    currentBalances[swapTokenInIndex],
    currentBalances[swapTokenOutIndex],
    amplification,
    currentInvariant,
    maxSurgeFee,
    surgeThreshold,
  ]);

  const initialCurvePoints = useMemo(() => {
    const initialInvariant = stableInvariant(amplification, initialBalances);

    const lastBalanceOut = initialBalances[swapTokenOutIndex] / 100;
    let lastBalanceIn = initialBalances[swapTokenInIndex];

    for (let i = 0; i < 1000; i++) {
      const currentIn = (i * initialBalances[swapTokenOutIndex]) / 10;
      const balances = [...initialBalances];
      balances[swapTokenInIndex] = currentIn;
      const currentOut = getTokenBalanceGivenInvariantAndAllOtherBalances(
        amplification,
        balances,
        initialInvariant,
        swapTokenOutIndex,
      );
      if (currentOut < lastBalanceOut) {
        lastBalanceIn = currentIn;
        break;
      }
    }

    const step = lastBalanceIn / 1000;

    return Array.from({ length: 1000 }, (_, i) => {
      const x = (i + 1) * step;
      const balances = [...initialBalances];
      balances[swapTokenInIndex] = x;
      const y = getTokenBalanceGivenInvariantAndAllOtherBalances(
        amplification,
        balances,
        initialInvariant,
        swapTokenOutIndex,
      );

      return { x, y };
    });
  }, [
    initialBalances[swapTokenInIndex],
    initialBalances[swapTokenOutIndex],
    amplification,
    swapTokenInIndex,
    swapTokenOutIndex,
  ]);

  const swapPreview = useMemo(() => {
    if (!swapAmountIn) return { amountOut: 0, fee: 0, feePercentage: 0 };

    // Calculate surge fee
    const newBalances = [...currentBalances];
    newBalances[swapTokenInIndex] += swapAmountIn;
    newBalances[swapTokenOutIndex] = getTokenBalanceGivenInvariantAndAllOtherBalances(
      amplification,
      newBalances,
      currentInvariant,
      swapTokenOutIndex,
    );

    const surgeFee = getSurgeFeePercentage(
      maxSurgeFee,
      surgeThreshold,
      swapFee,
      newBalances,
      currentBalances,
    );

    const fees = (swapAmountIn * surgeFee) / 100;

    const balances = [...currentBalances];
    balances[swapTokenInIndex] += swapAmountIn - fees;
    const newBalanceOut = getTokenBalanceGivenInvariantAndAllOtherBalances(
      amplification,
      balances,
      currentInvariant,
      swapTokenOutIndex,
    );
    return {
      amountOut: currentBalances[swapTokenOutIndex] - newBalanceOut,
      fee: fees,
      feePercentage: surgeFee,
    };
  }, [
    swapAmountIn,
    swapTokenInIndex,
    swapTokenOutIndex,
    currentBalances[swapTokenInIndex],
    currentBalances[swapTokenOutIndex],
    currentInvariant,
    maxSurgeFee,
    surgeThreshold,
    swapFee,
    amplification,
  ]);

  const [lowerImbalanceThreshold, upperImbalanceThreshold] = useMemo(() => {
    let lowerBalanceInImbalance = 0;
    let upperBalanceInImbalance = 0;
    let lowerImbalanceThreshold = { x: 0, y: 0 };
    let upperImbalanceThreshold = { x: 0, y: 0 };
    for (let i = 1; i <= 10000; i++) {
      const balances = [...initialBalances];
      balances[swapTokenInIndex] =
        (i * (initialBalances[swapTokenInIndex] + initialBalances[swapTokenOutIndex])) / 2 / 100;
      balances[swapTokenOutIndex] = getTokenBalanceGivenInvariantAndAllOtherBalances(
        amplification,
        balances,
        currentInvariant,
        swapTokenOutIndex,
      );

      const imbalance = calculateImbalance(balances);
      if (imbalance < surgeThreshold && lowerBalanceInImbalance === 0) {
        lowerBalanceInImbalance = balances[swapTokenInIndex];
        lowerImbalanceThreshold = {
          x: balances[swapTokenInIndex],
          y: balances[swapTokenOutIndex],
        };
      }
      if (
        imbalance > surgeThreshold &&
        upperBalanceInImbalance === 0 &&
        lowerBalanceInImbalance !== 0
      ) {
        upperBalanceInImbalance = balances[swapTokenInIndex];
        upperImbalanceThreshold = {
          x: balances[swapTokenInIndex],
          y: balances[swapTokenOutIndex],
        };
        break;
      }
    }
    return [lowerImbalanceThreshold, upperImbalanceThreshold];
  }, [
    currentInvariant,
    surgeThreshold,
    swapTokenInIndex,
    swapTokenOutIndex,
    initialBalances[swapTokenInIndex],
    initialBalances[swapTokenOutIndex],
    amplification,
  ]);

  const previewPoint = useMemo(() => {
    if (!swapPreview.amountOut) return undefined;

    return {
      x: currentBalances[swapTokenInIndex] + swapAmountIn,
      y: currentBalances[swapTokenOutIndex] - swapPreview.amountOut,
    };
  }, [swapPreview, swapAmountIn, swapTokenInIndex, currentBalances]);

  const handleUpdate = () => {
    setTokenCount(inputTokenCount);
    setInitialBalances(inputBalances.slice(0, inputTokenCount));
    setCurrentBalances(inputBalances.slice(0, inputTokenCount));
    setTotalFees(Array(inputTokenCount).fill(0));
    setAmplification(inputAmplification);
    setSwapFee(inputSwapFee);
    setMaxSurgeFee(inputMaxSurgeFee);
    setSurgeThreshold(inputSurgeThreshold);
  };

  const handleSwap = () => {
    const amountIn = Number(swapAmountIn);

    // Calculate surge fee
    const newBalances = [...currentBalances];
    newBalances[swapTokenInIndex] += swapAmountIn;
    newBalances[swapTokenOutIndex] = getTokenBalanceGivenInvariantAndAllOtherBalances(
      amplification,
      newBalances,
      currentInvariant,
      swapTokenOutIndex,
    );

    const surgeFee = getSurgeFeePercentage(
      maxSurgeFee,
      surgeThreshold,
      swapFee,
      newBalances,
      currentBalances,
    );

    const fees = (amountIn * surgeFee) / 100;

    currentBalances[swapTokenInIndex] += amountIn - fees;
    currentBalances[swapTokenOutIndex] = getTokenBalanceGivenInvariantAndAllOtherBalances(
      amplification,
      currentBalances,
      currentInvariant,
      swapTokenOutIndex,
    );
    setCurrentBalances(currentBalances);
    setTotalFees(prevFees => {
      const newFees = [...prevFees];
      newFees[swapTokenInIndex] += fees;
      return newFees;
    });
  };

  return (
    <Container maxW="container.xl">
      <Grid templateColumns="1fr 2fr" gap={4}>
        {/* Left Column - Controls */}
        <GridItem>
          <Accordion allowToggle defaultIndex={[0]}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading size="md">Configure Pool</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Select
                  value={inputTokenCount}
                  onChange={e => setInputTokenCount(Number(e.target.value))}
                  mb={4}
                >
                  <option value={2}>2 Tokens</option>
                  <option value={3}>3 Tokens</option>
                  <option value={4}>4 Tokens</option>
                </Select>
                <FormControl variant="floating">
                  <FormLabel>Initial Balance A</FormLabel>
                  <Input
                    placeholder={`Initial Balance ${tokenNames[0]}`}
                    type="number"
                    mb={4}
                    value={inputBalances[0]}
                    onChange={e =>
                      setInputBalances(prev => {
                        const result = [...prev];
                        result[0] = Number(e.target.value);
                        return result;
                      })
                    }
                  />
                </FormControl>
                <FormControl variant="floating">
                  <FormLabel>Initial Balance B</FormLabel>
                  <Input
                    placeholder={`Initial Balance ${tokenNames[1]}`}
                    type="number"
                    mb={4}
                    value={inputBalances[1]}
                    onChange={e =>
                      setInputBalances(prev => {
                        const result = [...prev];
                        result[1] = Number(e.target.value);
                        return result;
                      })
                    }
                  />
                </FormControl>

                {inputTokenCount >= 3 && (
                  <FormControl variant="floating">
                    <FormLabel>Initial Balance C</FormLabel>
                    <Input
                      placeholder={`Initial Balance ${tokenNames[2]}`}
                      type="number"
                      mb={4}
                      value={inputBalances[2]}
                      onChange={e =>
                        setInputBalances(prev => {
                          const result = [...prev];
                          result[2] = Number(e.target.value);
                          return result;
                        })
                      }
                    />
                  </FormControl>
                )}

                {inputTokenCount >= 4 && (
                  <FormControl variant="floating">
                    <FormLabel>Initial Balance D</FormLabel>
                    <Input
                      placeholder={`Initial Balance ${tokenNames[3]}`}
                      type="number"
                      mb={4}
                      value={inputBalances[3]}
                      onChange={e =>
                        setInputBalances(prev => {
                          const result = [...prev];
                          result[3] = Number(e.target.value);
                          return result;
                        })
                      }
                    />
                  </FormControl>
                )}
                <FormControl variant="floating" mb={6} maxW="400px">
                  <FormLabel>Amplification Parameter: {inputAmplification}</FormLabel>
                  <Box pt={6} pb={2}>
                    <Slider
                      maxWidth={350}
                      id="amplification-slider"
                      value={inputAmplification}
                      min={1}
                      max={50000}
                      step={250}
                      onChange={val => setInputAmplification(val)}
                      onMouseEnter={() => setShowAmplificationTooltip(true)}
                      onMouseLeave={() => setShowAmplificationTooltip(false)}
                    >
                      {/* Create clickable marks */}
                      {markValues.map(value => (
                        <Box
                          key={value}
                          position="absolute"
                          left={`${(value / 50000) * 100}%`}
                          transform="translateX(-50%)"
                          mt="-10px"
                        >
                          <Box
                            as="button"
                            fontSize="sm"
                            cursor="pointer"
                            onClick={() => handleMarkClick(value)}
                            _hover={{ color: "blue.500" }}
                            mt="20px"
                          >
                            {value.toLocaleString()}
                          </Box>
                          <Box
                            position="absolute"
                            top="0"
                            left="50%"
                            transform="translateX(-50%)"
                            w="2px"
                            h="10px"
                            bg="gray.300"
                          />
                        </Box>
                      ))}
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <Tooltip
                        hasArrow
                        bg="blue.500"
                        color="white"
                        placement="top"
                        isOpen={showAmplificationTooltip}
                        label={inputAmplification.toLocaleString()}
                      >
                        <SliderThumb />
                      </Tooltip>
                    </Slider>
                  </Box>
                </FormControl>

                <FormControl variant="floating">
                  <FormLabel>Static Swap Fee (%)</FormLabel>
                  <Input
                    placeholder="Static Swap Fee (%)"
                    type="number"
                    mb={4}
                    value={inputSwapFee}
                    onChange={e => setInputSwapFee(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                  />

                  <FormLabel>Max Surge Fee (%)</FormLabel>
                  <Input
                    placeholder="Max Surge Fee (%)"
                    type="number"
                    mb={4}
                    value={inputMaxSurgeFee}
                    onChange={e => setInputMaxSurgeFee(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                  />

                  <FormLabel>Surge Threshold (%)</FormLabel>
                  <Input
                    placeholder="Surge Threshold (%)"
                    type="number"
                    mb={4}
                    value={inputSurgeThreshold}
                    onChange={e => setInputSurgeThreshold(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </FormControl>

                <Button colorScheme="blue" width="full" onClick={handleUpdate} mt={2}>
                  Initialize Pool
                </Button>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading size="md">Swap Exact In</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <FormControl variant="floating">
                  <FormLabel> Sell Token</FormLabel>
                  <Select
                    value={swapTokenInIndex}
                    onChange={e => setSwapTokenInIndex(Number(e.target.value))}
                    mb={4}
                  >
                    <option value={0}>{tokenNames[0]}</option>
                    <option value={1}>{tokenNames[1]}</option>
                    {tokenCount >= 3 && <option value={2}>{tokenNames[2]}</option>}
                    {tokenCount >= 4 && <option value={3}>{tokenNames[3]}</option>}
                  </Select>

                  <FormLabel> Buy Token</FormLabel>
                  <Select
                    value={swapTokenOutIndex}
                    onChange={e => setSwapTokenOutIndex(Number(e.target.value))}
                    mb={4}
                  >
                    <option value={0} disabled={swapTokenInIndex === 0}>
                      {tokenNames[0]}
                    </option>
                    <option value={1} disabled={swapTokenInIndex === 1}>
                      {tokenNames[1]}
                    </option>
                    {tokenCount >= 3 && (
                      <option value={2} disabled={swapTokenInIndex === 2}>
                        {tokenNames[2]}
                      </option>
                    )}
                    {tokenCount >= 4 && (
                      <option value={3} disabled={swapTokenInIndex === 3}>
                        {tokenNames[3]}
                      </option>
                    )}
                  </Select>

                  <FormLabel> Sell Token Amount</FormLabel>
                  <Input
                    placeholder="Amount In"
                    type="number"
                    mb={4}
                    value={swapAmountIn}
                    onChange={e => setSwapAmountIn(Number(e.target.value))}
                  />

                  <Text mb={2}>
                    Amount Out {tokenNames[swapTokenOutIndex]}:{" "}
                    {swapPreview.amountOut > 0 ? swapPreview.amountOut.toFixed(2) : "0"}
                  </Text>

                  <Text mb={2}>Surge Fee (%): {swapPreview.feePercentage.toFixed(2)}</Text>

                  <Text mb={2}>
                    Fee: {swapPreview.fee > 0 ? swapPreview.fee.toFixed(2) : "0"}{" "}
                    {tokenNames[swapTokenInIndex]}
                  </Text>

                  <Button colorScheme="green" width="full" onClick={handleSwap} mt={2}>
                    Swap
                  </Button>
                </FormControl>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading size="md">Token Configuration</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <FormControl variant="floating">
                  <FormLabel>Token 1</FormLabel>
                  <Input
                    placeholder="Token A Name"
                    mb={4}
                    value={tokenNames[0]}
                    onChange={e =>
                      setTokenNames(prev => {
                        const result = [...prev];
                        result[0] = e.target.value;
                        return result;
                      })
                    }
                  />

                  <FormLabel>Token 2</FormLabel>
                  <Input
                    placeholder="Token B Name"
                    mb={4}
                    value={tokenNames[1]}
                    onChange={e =>
                      setTokenNames(prev => {
                        const result = [...prev];
                        result[1] = e.target.value;
                        return result;
                      })
                    }
                  />

                  {tokenCount >= 3 && (
                    <FormControl variant="floating">
                      <FormLabel>Token 3</FormLabel>
                      <Input
                        placeholder="Token C Name"
                        mb={4}
                        value={tokenNames[2]}
                        onChange={e =>
                          setTokenNames(prev => {
                            const result = [...prev];
                            result[2] = e.target.value;
                            return result;
                          })
                        }
                      />
                    </FormControl>
                  )}

                  {tokenCount >= 4 && (
                    <FormControl variant="floating">
                      <FormLabel>Token 4</FormLabel>
                      <Input
                        placeholder="Token D Name"
                        mb={4}
                        value={tokenNames[3]}
                        onChange={e =>
                          setTokenNames(prev => {
                            const result = [...prev];
                            result[3] = e.target.value;
                            return result;
                          })
                        }
                      />
                    </FormControl>
                  )}
                </FormControl>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </GridItem>

        {/* Middle Column - Chart */}
        <GridItem>
          <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md" textAlign="center">
            <Box width="800px" height="800px">
              <StableSurgeChart
                curvePoints={curvePoints}
                curvePointsWithFees={curvePointsWithFees}
                currentPoint={{
                  x: currentBalances[swapTokenInIndex],
                  y: currentBalances[swapTokenOutIndex],
                }}
                initialCurvePoints={initialCurvePoints}
                previewPoint={previewPoint}
                lowerImbalanceThreshold={lowerImbalanceThreshold}
                upperImbalanceThreshold={upperImbalanceThreshold}
                tokenInName={tokenNames[swapTokenInIndex]}
                tokenOutName={tokenNames[swapTokenOutIndex]}
              />
            </Box>
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
}

import React, { useRef, useEffect, useMemo, useState } from "react";
import {
  Box,
  Text,
  Circle,
  useTheme,
  Checkbox,
  VStack,
  HStack,
  Heading,
  Tooltip,
} from "@chakra-ui/react";
import { calculateLowerMargin, calculateUpperMargin } from "./ReClammMath";

interface ReClammChartProps {
  realTimeBalanceA: number;
  realTimeBalanceB: number;
  margin: number;
  realTimeVirtualBalances: {
    virtualBalanceA: number;
    virtualBalanceB: number;
  };
  realTimeInvariant: number;
  initialInvariant: number;
  currentBalanceA: number;
  currentBalanceB: number;
  currentVirtualBalances: {
    virtualBalanceA: number;
    virtualBalanceB: number;
  };
  currentInvariant: number;
}

const NUM_POINTS = 100;
const MARGIN_FACTOR = 0.1;

export const ReClammChart: React.FC<ReClammChartProps> = ({
  realTimeBalanceA,
  realTimeBalanceB,
  margin,
  realTimeVirtualBalances,
  realTimeInvariant,
  initialInvariant,
  currentBalanceA,
  currentBalanceB,
  currentVirtualBalances,
  currentInvariant,
}) => {
  const theme = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 200, height: 200 });

  // State for visibility toggles
  const [visibility, setVisibility] = useState({
    realTimeInvariant: true,
    currentInvariant: true,
    initialInvariant: true,
    balances: true,
    minMaxPrices: true,
    margins: true,
  });

  // Colors configuration - inherit from theme or use defaults
  const colors = {
    realTimeInvariant: theme?.colors?.green?.[400] || "#4CAF50",
    currentInvariant: theme?.colors?.blue?.[400] || "#5e72e4",
    initialInvariant: theme?.colors?.red?.[400] || "#ff6b6b",
    balances: theme?.colors?.green?.[500] || "#2dce89",
    minMaxPrices: theme?.colors?.red?.[400] || "#ff6b6b",
    margins: theme?.colors?.blue?.[400] || "#5e72e4",
    gridLine: theme?.colors?.gray?.[200] || "#E2E8F0",
    text: theme?.colors?.gray?.[800] || theme?.colors?.black || "#2D3748",
    axisText: theme?.colors?.gray?.[600] || "#718096",
  };

  // Legend items
  const legendItems = [
    { id: "realTimeInvariant", color: colors.realTimeInvariant, text: "Real Time Invariant" },
    { id: "currentInvariant", color: colors.currentInvariant, text: "Current Invariant" },
    { id: "initialInvariant", color: colors.initialInvariant, text: "Initial Invariant", isDashed: true },
    { id: "balances", color: colors.balances, text: "Balances", isPoint: true },
    { id: "minMaxPrices", color: colors.minMaxPrices, text: "Min/Max Prices", isPoint: true },
    { id: "margins", color: colors.margins, text: "Margins", isPoint: true },
  ];

  // Resize observer effect
  useEffect(() => {
    if (!chartRef.current) return;

    const updateSize = () => {
      if (chartRef.current) {
        const containerWidth = chartRef.current.offsetWidth;
        const width = Math.max(containerWidth, 200);
        const height = 600; // Fixed height like D3 version
        setChartSize({ width, height });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(chartRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const realTimeChartData = useMemo(() => {
    const xForPointB = realTimeInvariant / realTimeVirtualBalances.virtualBalanceB;

    return Array.from({ length: NUM_POINTS }, (_, i) => {
      const x =
        (1 - MARGIN_FACTOR) * realTimeVirtualBalances.virtualBalanceA +
        (i *
          ((1 + MARGIN_FACTOR) * xForPointB -
            (1 - MARGIN_FACTOR) * realTimeVirtualBalances.virtualBalanceA)) /
          NUM_POINTS;
      const y = realTimeInvariant / x;
      return { x, y };
    });
  }, [realTimeVirtualBalances, realTimeInvariant]);

  const chartInitialData = useMemo(() => {
    const xForPointB = initialInvariant / realTimeVirtualBalances.virtualBalanceB;

    return Array.from({ length: NUM_POINTS }, (_, i) => {
      const x =
        (1 - MARGIN_FACTOR) * realTimeVirtualBalances.virtualBalanceA +
        (i *
          ((1 + MARGIN_FACTOR) * xForPointB -
            (1 - MARGIN_FACTOR) * realTimeVirtualBalances.virtualBalanceA)) /
          NUM_POINTS;
      const y = initialInvariant / x;
      return { x, y };
    });
  }, [initialInvariant, realTimeVirtualBalances]);

  const currentChartData = useMemo(() => {
    const xForPointB = currentInvariant / currentVirtualBalances.virtualBalanceB;

    return Array.from({ length: NUM_POINTS }, (_, i) => {
      const x =
        0.7 * currentVirtualBalances.virtualBalanceA +
        (i * (1.3 * xForPointB - 0.7 * currentVirtualBalances.virtualBalanceA)) / NUM_POINTS;
      const y = currentInvariant / x;
      return { x, y };
    });
  }, [currentVirtualBalances, currentInvariant]);

  const specialPoints = useMemo(() => {
    const realTimeRealMargin = calculateLowerMargin({
      margin,
      invariant: realTimeInvariant,
      virtualBalanceA: realTimeVirtualBalances.virtualBalanceA,
      virtualBalanceB: realTimeVirtualBalances.virtualBalanceB,
    });

    const realTimeUpperMargin = calculateUpperMargin({
      margin,
      invariant: realTimeInvariant,
      virtualBalanceA: realTimeVirtualBalances.virtualBalanceA,
      virtualBalanceB: realTimeVirtualBalances.virtualBalanceB,
    });

    const currentLowerMargin = calculateLowerMargin({
      margin,
      invariant: currentInvariant,
      virtualBalanceA: currentVirtualBalances.virtualBalanceA,
      virtualBalanceB: currentVirtualBalances.virtualBalanceB,
    });

    const currentUpperMargin = calculateUpperMargin({
      margin,
      invariant: currentInvariant,
      virtualBalanceA: currentVirtualBalances.virtualBalanceA,
      virtualBalanceB: currentVirtualBalances.virtualBalanceB,
    });

    return {
      minMaxPrices: [
        { x: realTimeVirtualBalances.virtualBalanceA, y: realTimeInvariant / realTimeVirtualBalances.virtualBalanceA },
        { x: realTimeInvariant / realTimeVirtualBalances.virtualBalanceB, y: realTimeVirtualBalances.virtualBalanceB },
        { x: currentVirtualBalances.virtualBalanceA, y: currentInvariant / currentVirtualBalances.virtualBalanceA },
        { x: currentInvariant / currentVirtualBalances.virtualBalanceB, y: currentVirtualBalances.virtualBalanceB },
      ],
      balances: [
        {
          x: realTimeBalanceA + realTimeVirtualBalances.virtualBalanceA,
          y: realTimeBalanceB + realTimeVirtualBalances.virtualBalanceB,
        },
        {
          x: currentBalanceA + currentVirtualBalances.virtualBalanceA,
          y: currentBalanceB + currentVirtualBalances.virtualBalanceB,
        },
      ],
      margins: [
        { x: realTimeRealMargin, y: realTimeInvariant / realTimeRealMargin },
        { x: realTimeUpperMargin, y: realTimeInvariant / realTimeUpperMargin },
        { x: currentLowerMargin, y: currentInvariant / currentLowerMargin },
        { x: currentUpperMargin, y: currentInvariant / currentUpperMargin },
      ],
    };
  }, [
    realTimeBalanceA,
    realTimeBalanceB,
    currentBalanceA,
    currentBalanceB,
    margin,
    realTimeVirtualBalances,
    currentVirtualBalances,
    realTimeInvariant,
    currentInvariant,
  ]);

  // Calculate scales and domains for the chart - FIXED to match D3 behavior
  const chartMargin = { top: 40, right: 40, bottom: 60, left: 60 };
  const innerWidth = chartSize.width - chartMargin.left - chartMargin.right;
  const innerHeight = chartSize.height - chartMargin.top - chartMargin.bottom;

  // Use ONLY the realTimeChartData for domain calculation (like D3 version)
  const xMin = Math.min(...realTimeChartData.map(d => d.x));
  const xMax = Math.max(...realTimeChartData.map(d => d.x));
  const yMin = Math.min(...realTimeChartData.map(d => d.y));
  const yMax = Math.max(...realTimeChartData.map(d => d.y));

  const xDomain = [xMin, xMax];
  const yDomain = [yMin, yMax];

  // Functions to convert data coordinates to screen coordinates
  const scaleX = (x: number): number => {
    return ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth;
  };

  const scaleY = (y: number): number => {
    return innerHeight - ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;
  };

  // Generate axis ticks using D3-like behavior
  const generateTicks = (min: number, max: number, count = 5): number[] => {
    const range = max - min;
    const step = range / (count - 1);
    return Array.from({ length: count }, (_, i) => min + i * step);
  };

  // Format number for display
  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    } else {
      return value.toFixed(2);
    }
  };

  const xTicks = generateTicks(xDomain[0], xDomain[1], 5);
  const yTicks = generateTicks(yDomain[0], yDomain[1], 5);

  // Generate SVG path from points
  const generatePath = (points: { x: number; y: number }[]): string => {
    if (points.length < 2) return "";
    
    let path = `M ${scaleX(points[0].x)} ${scaleY(points[0].y)}`;
    
    for (let i = 1; i < points.length; i++) {
      const x = scaleX(points[i].x);
      const y = scaleY(points[i].y);
      path += ` L ${x} ${y}`;
    }
    
    return path;
  };

  return (
    <Box width="100%" padding="20px" ref={chartRef}>
      <Box
        position="relative"
        width={`${chartSize.width}px`}
        height={`${chartSize.height}px`}
        maxWidth="100%"
        bg="transparent"
      >
        {/* Chart title */}
        <Heading
          size="md"
          position="absolute"
          top={`${chartMargin.top / 2 - 15}px`}
          left="50%"
          transform="translateX(-50%)"
          textAlign="center"
        >
          ReCLAMM Chart
        </Heading>

        {/* Chart container */}
        <Box
          position="absolute"
          top={`${chartMargin.top}px`}
          left={`${chartMargin.left}px`}
          width={`${innerWidth}px`}
          height={`${innerHeight}px`}
          borderRadius="md"
          overflow="hidden"
        >
          {/* Grid lines */}
          {xTicks.map((tick, i) => {
            const xPos = scaleX(tick);
            if (xPos >= 0 && xPos <= innerWidth) {
              return (
                <Box
                  key={`x-grid-${i}`}
                  position="absolute"
                  top="0"
                  left={`${xPos}px`}
                  height="100%"
                  borderLeft={`1px solid`}
                  opacity={0.3}
                />
              );
            }
            return null;
          })}
          
          {yTicks.map((tick, i) => {
            const yPos = scaleY(tick);
            if (yPos >= 0 && yPos <= innerHeight) {
              return (
                <Box
                  key={`y-grid-${i}`}
                  position="absolute"
                  left="0"
                  top={`${yPos}px`}
                  width="100%"
                  borderTop={`1px solid`}
                  opacity={0.3}
                />
              );
            }
            return null;
          })}

          {/* Reference lines */}
          {(() => {
            const virtualBalanceAPos = scaleX(realTimeVirtualBalances.virtualBalanceA);
            const virtualBalanceBPos = scaleY(realTimeVirtualBalances.virtualBalanceB);
            return (
              <>
                {virtualBalanceAPos >= 0 && virtualBalanceAPos <= innerWidth && (
                  <Box
                    position="absolute"
                    top="0"
                    left={`${virtualBalanceAPos}px`}
                    height="100%"
                    borderLeft="2px solid #BBBBBB"
                    opacity={0.8}
                  />
                )}
                {virtualBalanceBPos >= 0 && virtualBalanceBPos <= innerHeight && (
                  <Box
                    position="absolute"
                    left="0"
                    top={`${virtualBalanceBPos}px`}
                    width="100%"
                    borderTop="2px solid #BBBBBB"
                    opacity={0.8}
                  />
                )}
              </>
            );
          })()}

          {/* Initial invariant curve */}
          {visibility.initialInvariant && (
            <Box
              as="svg"
              position="absolute"
              top="0"
              left="0"
              width="100%"
              height="100%"
              pointerEvents="none"
            >
              <path
                d={generatePath(chartInitialData)}
                fill="none"
                stroke={colors.initialInvariant}
                strokeWidth="2px"
                strokeDasharray="5,5"
              />
            </Box>
          )}

          {/* Current invariant curve */}
          {visibility.currentInvariant && (
            <Box
              as="svg"
              position="absolute"
              top="0"
              left="0"
              width="100%"
              height="100%"
              pointerEvents="none"
            >
              <path
                d={generatePath(currentChartData)}
                fill="none"
                stroke={colors.currentInvariant}
                strokeWidth="2px"
              />
            </Box>
          )}

          {/* Real time invariant curve */}
          {visibility.realTimeInvariant && (
            <Box
              as="svg"
              position="absolute"
              top="0"
              left="0"
              width="100%"
              height="100%"
              pointerEvents="none"
            >
              <path
                d={generatePath(realTimeChartData)}
                fill="none"
                stroke={colors.realTimeInvariant}
                strokeWidth="2px"
              />
            </Box>
          )}

          {/* Balance points */}
          {visibility.balances && specialPoints.balances.map((point, i) => {
            const xPos = scaleX(point.x);
            const yPos = scaleY(point.y);
            if (xPos >= -10 && xPos <= innerWidth + 10 && yPos >= -10 && yPos <= innerHeight + 10) {
              return (
                <Tooltip
                  key={`balance-${i}`}
                  label={`Balance A: ${i === 0 ? realTimeBalanceA.toFixed(2) : currentBalanceA.toFixed(2)}, Balance B: ${i === 0 ? realTimeBalanceB.toFixed(2) : currentBalanceB.toFixed(2)}`}
                  placement="top"
                >
                  <Circle
                    position="absolute"
                    top={`${yPos}px`}
                    left={`${xPos}px`}
                    size="10px"
                    bg={colors.balances}
                    border="2px solid white"
                    transform="translate(-50%, -50%)"
                    cursor="pointer"
                  />
                </Tooltip>
              );
            }
            return null;
          })}

          {/* Min/Max price points */}
          {visibility.minMaxPrices && specialPoints.minMaxPrices.map((point, i) => {
            const xPos = scaleX(point.x);
            const yPos = scaleY(point.y);
            if (xPos >= -10 && xPos <= innerWidth + 10 && yPos >= -10 && yPos <= innerHeight + 10) {
              return (
                <Circle
                  key={`price-${i}`}
                  position="absolute"
                  top={`${yPos}px`}
                  left={`${xPos}px`}
                  size="10px"
                  bg={colors.minMaxPrices}
                  border="2px solid white"
                  transform="translate(-50%, -50%)"
                />
              );
            }
            return null;
          })}

          {/* Margin points */}
          {visibility.margins && specialPoints.margins.map((point, i) => {
            const xPos = scaleX(point.x);
            const yPos = scaleY(point.y);
            if (xPos >= -10 && xPos <= innerWidth + 10 && yPos >= -10 && yPos <= innerHeight + 10) {
              return (
                <Circle
                  key={`margin-${i}`}
                  position="absolute"
                  top={`${yPos}px`}
                  left={`${xPos}px`}
                  size="10px"
                  bg={colors.margins}
                  border="2px solid white"
                  transform="translate(-50%, -50%)"
                />
              );
            }
            return null;
          })}
        </Box>

        {/* X-axis labels */}
        {xTicks.map((tick, i) => (
          <Text
            key={`x-label-${i}`}
            position="absolute"
            top={`${chartMargin.top + innerHeight + 15}px`}
            left={`${chartMargin.left + scaleX(tick)}px`}
            transform="translateX(-50%)"
            fontSize="12px"
            fontWeight="medium"
          >
            {formatNumber(tick)}
          </Text>
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <Text
            key={`y-label-${i}`}
            position="absolute"
            top={`${chartMargin.top + scaleY(tick)}px`}
            left={`${chartMargin.left - 15}px`}
            transform="translateY(-50%)"
            textAlign="right"
            fontSize="12px"
            fontWeight="medium"
            width="50px"
          >
            {formatNumber(tick)}
          </Text>
        ))}

        {/* Axis labels */}
        <Text
          position="absolute"
          bottom="5px"
          left="50%"
          transform="translateX(-50%)"
          fontWeight="bold"
          fontSize="14px"
        >
          Total Balance A
        </Text>

        <Text
          position="absolute"
          top="50%"
          left="5px"
          transform="translateY(-50%) rotate(-90deg)"
          fontWeight="bold"
          fontSize="14px"
        >
          Total Balance B
        </Text>

        {/* Legend */}
        <Box
          position="absolute"
          top={`${chartMargin.top + 20}px`}
          right={`${chartMargin.right + 20}px`}
          borderRadius="md"
          border="1px solid"
          padding="12px"
          width="220px"
          backdropFilter="blur(5px)"
        >
          <VStack spacing={2} align="stretch">
            {legendItems.map((item) => (
              <HStack key={item.id} spacing={3}>
                <Checkbox
                  isChecked={visibility[item.id as keyof typeof visibility]}
                  onChange={() => 
                    setVisibility({
                      ...visibility,
                      [item.id]: !visibility[item.id as keyof typeof visibility]
                    })
                  }
                  size="sm"
                />
                {item.isPoint ? (
                  <Circle size="8px" bg={item.color} border="1px solid white" />
                ) : (
                  <Box
                    height="2px"
                    width="12px"
                    bg={item.color}
                    borderStyle={item.isDashed ? "dashed" : "solid"}
                    borderWidth={item.isDashed ? "1px" : "0"}
                    borderColor={item.isDashed ? item.color : "transparent"}
                  />
                )}
                <Text fontSize="11px" fontWeight="500">
                  {item.text}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};
import { useEffect, useRef, useState } from "react";
import { Box, Text, Circle, useTheme, Checkbox, Heading, HStack, VStack } from "@chakra-ui/react";

export const StableSurgeChart: React.FC<{
  curvePoints: { x: number; y: number }[];
  curvePointsWithFees: { x: number; y: number }[];
  currentPoint?: { x: number; y: number };
  initialCurvePoints?: { x: number; y: number }[];
  previewPoint?: { x: number; y: number };
  lowerImbalanceThreshold?: { x: number; y: number };
  upperImbalanceThreshold?: { x: number; y: number };
  tokenInName?: string;
  tokenOutName?: string;
}> = ({
  curvePoints,
  curvePointsWithFees,
  currentPoint,
  initialCurvePoints,
  previewPoint,
  lowerImbalanceThreshold,
  upperImbalanceThreshold,
  tokenInName = "Balance A",
  tokenOutName = "Balance B",
}) => {
  const theme = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 500, height: 500 });

  // State for visibility toggles
  const [visibility, setVisibility] = useState({
    currentInvariant: true,
    invariantWithFees: true,
    initialInvariant: true,
    currentBalances: true,
    previewBalances: true,
    imbalanceThresholds: true,
  });

  // Colors
  const colors = {
    currentInvariant: "#5e72e4",
    invariantWithFees: "#2dce89",
    initialInvariant: "#ff6b6b",
    gridLine: "#ccc",
  };

  // Legend items
  const legendItems = [
    { id: "currentInvariant", color: colors.currentInvariant, text: "Current Invariant" },
    { id: "invariantWithFees", color: colors.invariantWithFees, text: "Invariant with Fees" },
    {
      id: "initialInvariant",
      color: colors.initialInvariant,
      text: "Initial Invariant",
      isDashed: true,
    },
    {
      id: "currentBalances",
      color: colors.currentInvariant,
      text: "Current Balances",
      isPoint: true,
    },
    {
      id: "previewBalances",
      color: colors.invariantWithFees,
      text: "Post-Swap Balances",
      isPoint: true,
    },
    {
      id: "imbalanceThresholds",
      color: colors.initialInvariant,
      text: "Imbalance Thresholds",
      isPoint: true,
    },
  ];

  // Resize observer effect
  useEffect(() => {
    if (!chartRef.current) return;

    const updateSize = () => {
      if (chartRef.current) {
        const containerWidth = chartRef.current.offsetWidth;
        const aspectRatio = 1; // Keep it square
        // Calculate height based on width and aspect ratio
        // Ensure it's not too small
        const width = Math.max(containerWidth, 300);
        const height = width * aspectRatio;
        setChartSize({ width, height });
      }
    };

    // Initial size update
    updateSize();

    // Create resize observer
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(chartRef.current);

    // Handle window resize too
    window.addEventListener("resize", updateSize);

    // Clean up
    return () => {
      if (chartRef.current) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  // Calculate scales and domains for the chart
  // Increase margins to accommodate labels
  const margin = { top: 50, right: 60, bottom: 80, left: 80 };
  const innerWidth = chartSize.width - margin.left - margin.right;
  const innerHeight = chartSize.height - margin.top - margin.bottom;

  // Get all points for domain calculation
  const allPoints = [
    ...curvePoints,
    ...(initialCurvePoints || []),
    ...(currentPoint ? [currentPoint] : []),
    ...(previewPoint ? [previewPoint] : []),
    ...(lowerImbalanceThreshold ? [lowerImbalanceThreshold] : []),
    ...(upperImbalanceThreshold ? [upperImbalanceThreshold] : []),
  ];

  // Find min and max for both x and y
  const xMin = Math.min(...allPoints.map(d => d.x));
  const xMax = Math.max(...allPoints.map(d => d.x));
  const yMin = Math.min(...allPoints.map(d => d.y));
  const yMax = Math.max(...allPoints.map(d => d.y));

  // Calculate the range to ensure equal scaling on both axes
  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  const maxRange = Math.max(xRange, yRange);

  // Calculate midpoints of the ranges
  const xMid = (xMin + xMax) / 2;
  const yMid = (yMin + yMax) / 2;

  // Set equal domains centered around the midpoint with 10% padding
  const xDomain = [xMid - (maxRange / 2) * 1.1, xMid + (maxRange / 2) * 1.1];
  const yDomain = [yMid - (maxRange / 2) * 1.1, yMid + (maxRange / 2) * 1.1];

  // Functions to convert data coordinates to screen coordinates
  const scaleX = (x: number): number => {
    return ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth;
  };

  const scaleY = (y: number): number => {
    return innerHeight - ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;
  };

  // Generate dynamic axis ticks based on actual data range
  const generateDynamicTicks = (min: number, max: number, count = 5): number[] => {
    // Handle edge cases
    if (min === max) {
      return [min];
    }

    // Calculate a nice step size based on the range
    const range = max - min;

    // Determine a power of 10 appropriate for this range
    const magnitude = Math.pow(10, Math.floor(Math.log10(range)));

    // Find a nice step size that will give us around the requested number of ticks
    let step: number;
    if (range / magnitude < 2) {
      step = 0.2 * magnitude; // Use 0.2, 0.4, 0.6, ...
    } else if (range / magnitude < 5) {
      step = 0.5 * magnitude; // Use 0.5, 1.0, 1.5, ...
    } else {
      step = magnitude; // Use 1, 2, 3, ...
    }

    // Calculate a nice starting point (lower than or equal to min)
    const niceMin = Math.floor(min / step) * step;

    // Generate the ticks
    const ticks: number[] = [];
    for (let tickValue = niceMin; tickValue <= max * 1.001; tickValue += step) {
      // Only include ticks that are close to or higher than the min value
      if (tickValue >= min * 0.999) {
        ticks.push(Number(tickValue.toFixed(2)));
      }
    }

    // Ensure we don't have too many ticks
    if (ticks.length > count + 2) {
      const simplifiedTicks: number[] = [];
      const skipFactor = Math.ceil(ticks.length / count);
      for (let i = 0; i < ticks.length; i += skipFactor) {
        simplifiedTicks.push(ticks[i]);
      }
      // Make sure we include the last tick if it's not already included
      if (simplifiedTicks[simplifiedTicks.length - 1] !== ticks[ticks.length - 1]) {
        simplifiedTicks.push(ticks[ticks.length - 1]);
      }
      return simplifiedTicks;
    }

    return ticks;
  };

  // Format number for display
  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    } else {
      return value.toFixed(value < 10 ? 2 : 1);
    }
  };

  // Generate the ticks using our dynamic tick generator
  const xTicks = generateDynamicTicks(xDomain[0], xDomain[1], 5);
  const yTicks = generateDynamicTicks(yDomain[0], yDomain[1], 5);

  // Generate SVG path from points
  const generatePath = (points: { x: number; y: number }[]): string => {
    if (points.length < 2) return "";

    let path = `M ${scaleX(points[0].x)} ${scaleY(points[0].y)}`;

    // Simple curve - we'll use quadratic curves between points
    for (let i = 1; i < points.length; i++) {
      const x = scaleX(points[i].x);
      const y = scaleY(points[i].y);
      path += ` L ${x} ${y}`;
    }

    return path;
  };

  return (
    <Box width="100%" padding="10px" ref={chartRef}>
      <Box
        position="relative"
        width={`${chartSize.width}px`}
        height={`${chartSize.height}px`}
        maxWidth="100%"
      >
        {/* Chart title */}
        <Heading
          size="md"
          position="absolute"
          top={`${margin.top / 2 - 15}px`}
          left="50%"
          transform="translateX(-50%)"
          textAlign="center"
        >
          StableSurge Curve
        </Heading>

        {/* Chart container */}
        <Box
          position="absolute"
          top={`${margin.top}px`}
          left={`${margin.left}px`}
          width={`${innerWidth}px`}
          height={`${innerHeight}px`}
          borderRadius="md"
          overflow="visible" // Changed from "hidden" to show labels
        >
          {/* Grid lines */}
          {xTicks.map((tick, i) => (
            <Box
              key={`x-grid-${i}`}
              position="absolute"
              top="0"
              left={`${scaleX(tick)}px`}
              height="100%"
              borderLeft={`1px solid ${colors.gridLine}`}
              opacity={0.2}
            />
          ))}

          {yTicks.map((tick, i) => (
            <Box
              key={`y-grid-${i}`}
              position="absolute"
              left="0"
              top={`${scaleY(tick)}px`}
              width="100%"
              borderTop={`1px solid ${colors.gridLine}`}
              opacity={0.2}
            />
          ))}

          {/* Initial curve */}
          {initialCurvePoints && visibility.initialInvariant && (
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
                d={generatePath(initialCurvePoints)}
                fill="none"
                stroke={colors.initialInvariant}
                strokeWidth="2.5px"
                strokeDasharray="6,4"
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
                d={generatePath(curvePoints)}
                fill="none"
                stroke={colors.currentInvariant}
                strokeWidth="3px"
              />
            </Box>
          )}

          {/* Curve with fees */}
          {visibility.invariantWithFees && (
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
                d={generatePath(curvePointsWithFees)}
                fill="none"
                stroke={colors.invariantWithFees}
                strokeWidth="2.5px"
              />
            </Box>
          )}
        </Box>

        {/* X-axis labels */}
        {xTicks.map((tick, i) => (
          <Text
            key={`x-label-${i}`}
            position="absolute"
            top={`${margin.top + innerHeight + 15}px`}
            left={`${margin.left + scaleX(tick)}px`}
            transform="translateX(-50%) rotate(60deg)"
            transformOrigin="top center"
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
            top={`${margin.top + scaleY(tick)}px`}
            left={`${margin.left - 15}px`}
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
          {tokenInName}
        </Text>

        <Text
          position="absolute"
          top="50%"
          left="-5px"
          transform="translateY(-50%) rotate(-90deg)"
          fontWeight="bold"
          fontSize="14px"
        >
          {tokenOutName}
        </Text>

        {/* Current point */}
        {currentPoint && visibility.currentBalances && (
          <>
            <Circle
              position="absolute"
              top={`${margin.top + scaleY(currentPoint.y)}px`}
              left={`${margin.left + scaleX(currentPoint.x)}px`}
              size="12px"
              bg={colors.currentInvariant}
              border="2px solid white"
            />
            <Text
              position="absolute"
              top={`${margin.top + scaleY(currentPoint.y) - 10}px`}
              left={`${margin.left + scaleX(currentPoint.x) + 10}px`}
              fontSize="10px"
              fontWeight="bold"
              color="#555"
            >
              ({formatNumber(currentPoint.x)}, {formatNumber(currentPoint.y)})
            </Text>
          </>
        )}

        {/* Preview point */}
        {previewPoint && visibility.previewBalances && (
          <>
            <Circle
              position="absolute"
              top={`${margin.top + scaleY(previewPoint.y)}px`}
              left={`${margin.left + scaleX(previewPoint.x)}px`}
              size="12px"
              bg={colors.invariantWithFees}
              border="2px solid white"
            />
            <Text
              position="absolute"
              top={`${margin.top + scaleY(previewPoint.y) - 10}px`}
              left={`${margin.left + scaleX(previewPoint.x) + 10}px`}
              fontSize="10px"
              fontWeight="bold"
              color="#555"
            >
              ({formatNumber(previewPoint.x)}, {formatNumber(previewPoint.y)})
            </Text>
          </>
        )}

        {/* Imbalance threshold points */}
        {visibility.imbalanceThresholds && (
          <>
            {lowerImbalanceThreshold && (
              <Circle
                position="absolute"
                top={`${margin.top + scaleY(lowerImbalanceThreshold.y)}px`}
                left={`${margin.left + scaleX(lowerImbalanceThreshold.x)}px`}
                size="12px"
                bg={colors.initialInvariant}
                border="1.5px solid white"
              />
            )}
            {upperImbalanceThreshold && (
              <Circle
                position="absolute"
                top={`${margin.top + scaleY(upperImbalanceThreshold.y)}px`}
                left={`${margin.left + scaleX(upperImbalanceThreshold.x)}px`}
                size="12px"
                bg={colors.initialInvariant}
                border="1.5px solid white"
              />
            )}
          </>
        )}

        {/* Legend */}
        <Box
          position="absolute"
          top={`${margin.top + 60}px`}
          right={`${margin.right + 80}px`}
          borderRadius="md"
          border="1px solid #ddd"
          padding="10px"
          width="200px"
        >
          <VStack spacing={2} align="stretch">
            {legendItems.map(item => (
              <HStack key={item.id} spacing={2}>
                <Checkbox
                  isChecked={visibility[item.id as keyof typeof visibility]}
                  onChange={() =>
                    setVisibility({
                      ...visibility,
                      [item.id]: !visibility[item.id as keyof typeof visibility],
                    })
                  }
                  colorScheme={item.color.replace("#", "")}
                />
                {item.isPoint ? (
                  <Circle size="8px" bg={item.color} border="1px solid white" />
                ) : (
                  <Box
                    height="2px"
                    width="10px"
                    bg={item.color}
                    borderStyle={item.isDashed ? "dashed" : "solid"}
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

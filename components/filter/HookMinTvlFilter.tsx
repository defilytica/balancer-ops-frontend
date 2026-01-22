import { useEffect, useState } from "react";
import {
  VStack,
  HStack,
  Heading,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
} from "@chakra-ui/react";
import { shortCurrencyFormat } from "@/lib/utils/shortCurrencyFormat";

const SLIDER_Q1_VALUE = 100_000;
const SLIDER_MID_VALUE = 1_000_000;
const SLIDER_MAX_SLIDER_VALUE = 1000;

/**
 * Map slider value (0-1000) to TVL value.
 * 0–250: linear from 0 to 100,000
 * 250–500: linear from 100,000 to 1,000,000
 * 500–1000: exponential from 1,000,000 to 100,000,000
 */
function sliderValueToTvl(sliderValue: number): number {
  if (sliderValue <= 250) {
    return Math.round((sliderValue / 250) * SLIDER_Q1_VALUE);
  } else if (sliderValue <= 500) {
    const t = (sliderValue - 250) / 250;
    return Math.round(SLIDER_Q1_VALUE + t * (SLIDER_MID_VALUE - SLIDER_Q1_VALUE));
  } else {
    const minLog = 6;
    const maxLog = 8;
    const expPercent = (sliderValue - 500) / 500;
    const logValue = minLog + (maxLog - minLog) * expPercent;
    return Math.round(Math.pow(10, logValue));
  }
}

/**
 * Map TVL value to slider value (0-1000)
 */
function tvlToSliderValue(tvl: number): number {
  if (tvl <= SLIDER_Q1_VALUE) {
    return (tvl / SLIDER_Q1_VALUE) * 250;
  } else if (tvl <= SLIDER_MID_VALUE) {
    const t = (tvl - SLIDER_Q1_VALUE) / (SLIDER_MID_VALUE - SLIDER_Q1_VALUE);
    return 250 + t * 250;
  } else {
    const minLog = 6;
    const maxLog = 8;
    const valueLog = Math.log10(tvl);
    const expPercent = (valueLog - minLog) / (maxLog - minLog);
    return 500 + expPercent * 500;
  }
}

const SLIDER_STEP_CONFIG: { until: number; step: number }[] = [
  { until: 10000, step: 1000 },
  { until: 50000, step: 2500 },
  { until: 100000, step: 5000 },
  { until: 500000, step: 25000 },
  { until: 1000000, step: 50000 },
  { until: 10000000, step: 100000 },
  { until: 100000000, step: 1000000 },
];

function snapToStep(value: number): number {
  let prevUntil = 0;
  for (const { until, step } of SLIDER_STEP_CONFIG) {
    if (value <= until) {
      const base = prevUntil;
      const snapped = Math.round((value - base) / step) * step + base;
      return Math.max(base, Math.min(snapped, until));
    }
    prevUntil = until;
  }
  const { until, step } = SLIDER_STEP_CONFIG[SLIDER_STEP_CONFIG.length - 1];
  const base = SLIDER_STEP_CONFIG[SLIDER_STEP_CONFIG.length - 2].until;
  const snapped = Math.round((value - base) / step) * step + base;
  return Math.max(base, Math.min(snapped, until));
}

interface HookMinTvlFilterProps {
  minTvl: number | null;
  onMinTvlChange: (minTvl: number | null) => void;
}

export function HookMinTvlFilter({ minTvl, onMinTvlChange }: HookMinTvlFilterProps) {
  const [sliderValue, setSliderValue] = useState(() => tvlToSliderValue(minTvl || 0));

  const tvlValue = sliderValueToTvl(sliderValue);

  useEffect(() => {
    setSliderValue(tvlToSliderValue(minTvl || 0));
  }, [minTvl]);

  const handleSliderChange = (val: number) => {
    const rawValue = sliderValueToTvl(val);
    const snappedValue = snapToStep(rawValue);
    setSliderValue(tvlToSliderValue(snappedValue));
  };

  const handleSliderChangeEnd = (val: number) => {
    const rawValue = sliderValueToTvl(val);
    const snappedValue = snapToStep(rawValue);
    onMinTvlChange(snappedValue > 0 ? snappedValue : null);
  };

  return (
    <VStack w="full" spacing={2}>
      <HStack w="full">
        <Heading as="h3" size="sm">
          Minimum TVL
        </Heading>
        <Text fontSize="sm" ml="auto" fontWeight="medium">
          {shortCurrencyFormat(tvlValue)}
        </Text>
      </HStack>
      <Slider
        aria-label="slider-min-tvl"
        max={SLIDER_MAX_SLIDER_VALUE}
        min={0}
        onChange={handleSliderChange}
        onChangeEnd={handleSliderChangeEnd}
        step={1}
        value={sliderValue}
        colorScheme="green"
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </VStack>
  );
}

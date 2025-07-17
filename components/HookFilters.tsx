import { useState } from "react";
import {
  VStack,
  HStack,
  Box,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Icon,
  Badge,
  Divider,
  useColorModeValue,
  Text,
  Flex,
  Center,
  Heading,
} from "@chakra-ui/react";
import { Filter } from "react-feather";
import { NetworkSelector } from "@/components/NetworkSelector";
import { HookMinTvlFilter } from "@/components/HookMinTvlFilter";
import { AddressBook } from "@/types/interfaces";
import { HookType } from "@/components/HookParametersDashboardModule";

interface HookFiltersProps {
  selectedNetwork: string;
  onNetworkChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  minTvl: number | null;
  onMinTvlChange: (minTvl: number | null) => void;
  networkOptions: Array<{ label: string; apiID: string; chainId: string }>;
  networks: Record<string, any>;
  hookType: HookType;
  addressBook: AddressBook;
}

export function HookFilters({
  selectedNetwork,
  onNetworkChange,
  minTvl,
  onMinTvlChange,
  networkOptions,
  networks,
  hookType,
}: HookFiltersProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const textColor = useColorModeValue("#fff", "font.dark");

  // Calculate total active filters
  const totalFilterCount = (selectedNetwork !== "ALL" ? 1 : 0) + (minTvl !== null ? 1 : 0);

  const resetFilters = () => {
    onNetworkChange({ target: { value: "ALL" } } as React.ChangeEvent<HTMLSelectElement>);
    onMinTvlChange(null);
  };

  return (
    <Popover
      isLazy
      isOpen={isPopoverOpen}
      onClose={() => setIsPopoverOpen(false)}
      onOpen={() => setIsPopoverOpen(true)}
      placement="bottom-end"
    >
      <PopoverTrigger>
        <Button display="flex" gap="2" variant="tertiary">
          <Icon as={Filter} boxSize={4} />
          Filters
          {totalFilterCount > 0 && (
            <Badge
              bg="font.highlight"
              borderRadius="full"
              color={textColor}
              p="0"
              position="absolute"
              right="-9px"
              shadow="lg"
              top="-9px"
            >
              <Center h="5" w="5">
                {totalFilterCount}
              </Center>
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <Box shadow="2xl" zIndex="popover">
        <PopoverContent>
          <PopoverArrow bg="background.level3" />
          <PopoverCloseButton top="sm" />
          <PopoverBody p="md">
            <VStack align="start" spacing="md">
              <Box lineHeight="0" p="0">
                <Flex alignItems="center" gap="ms" justifyContent="space-between" w="full">
                  <Text
                    background="font.special"
                    backgroundClip="text"
                    display="inline"
                    fontSize="xs"
                    variant="eyebrow"
                  >
                    Filters
                  </Text>
                  {totalFilterCount > 0 && (
                    <Button h="fit-content" onClick={resetFilters} size="xs" variant="link">
                      Reset all
                    </Button>
                  )}
                </Flex>
              </Box>

              <Box w="full">
                <Heading as="h3" mb="sm" size="sm">
                  Networks
                </Heading>
                <NetworkSelector
                  networks={networks}
                  networkOptions={networkOptions}
                  selectedNetwork={selectedNetwork}
                  handleNetworkChange={onNetworkChange}
                />
              </Box>

              <Box w="full">
                <HookMinTvlFilter minTvl={minTvl} onMinTvlChange={onMinTvlChange} />
              </Box>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Box>
    </Popover>
  );
}

import { useState } from "react";
import {
  VStack,
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
  useColorModeValue,
  Text,
  Flex,
  Center,
  Heading,
  Checkbox,
} from "@chakra-ui/react";
import { Filter } from "react-feather";
import { NetworkSelector } from "@/components/NetworkSelector";
import { AddressBook } from "@/types/interfaces";

interface LiquidityBuffersFiltersProps {
  selectedNetwork: string;
  onNetworkChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  networkOptions: Array<{ label: string; apiID: string; chainId: string }>;
  networks: Record<string, any>;
  addressBook: AddressBook;
  showOnlyEmpty: boolean;
  onShowOnlyEmptyChange: (value: boolean) => void;
}

export function LiquidityBuffersFilters({
  selectedNetwork,
  onNetworkChange,
  networkOptions,
  networks,
  showOnlyEmpty,
  onShowOnlyEmptyChange,
}: LiquidityBuffersFiltersProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const textColor = useColorModeValue("#fff", "font.dark");

  const totalFilterCount = showOnlyEmpty ? 1 : 0;

  const resetFilters = () => {
    onShowOnlyEmptyChange(false);
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
              <Box>
                <Heading as="h3" mb="sm" size="sm">
                  Buffer status
                </Heading>
                <Checkbox
                  isChecked={showOnlyEmpty}
                  onChange={e => onShowOnlyEmptyChange(e.target.checked)}
                  colorScheme="blue"
                >
                  <Text fontSize="md">Not initialized</Text>
                </Checkbox>
              </Box>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Box>
    </Popover>
  );
}

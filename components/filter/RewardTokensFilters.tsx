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
interface RewardTokensFiltersProps {
  showWithRewardsOnly: boolean;
  onShowWithRewardsOnlyChange: (value: boolean) => void;
  showActiveOnly: boolean;
  onShowActiveOnlyChange: (value: boolean) => void;
  showDistributorOnly: boolean;
  onShowDistributorOnlyChange: (value: boolean) => void;
  isDistributorDisabled: boolean;
}

export function RewardTokensFilters({
  showWithRewardsOnly,
  onShowWithRewardsOnlyChange,
  showActiveOnly,
  onShowActiveOnlyChange,
  showDistributorOnly,
  onShowDistributorOnlyChange,
  isDistributorDisabled,
}: RewardTokensFiltersProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const textColor = useColorModeValue("#fff", "font.dark");

  const totalFilterCount =
    (showWithRewardsOnly ? 1 : 0) + (showActiveOnly ? 1 : 0) + (showDistributorOnly ? 1 : 0);

  const resetFilters = () => {
    onShowWithRewardsOnlyChange(false);
    onShowActiveOnlyChange(false);
    onShowDistributorOnlyChange(false);
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

              <Box>
                <Heading as="h3" mb="sm" size="sm">
                  Reward status
                </Heading>
                <VStack align="start" spacing={2}>
                  <Checkbox
                    isChecked={showWithRewardsOnly}
                    onChange={e => onShowWithRewardsOnlyChange(e.target.checked)}
                    colorScheme="purple"
                  >
                    <Text fontSize="md">Pools with reward tokens</Text>
                  </Checkbox>
                  <Checkbox
                    isChecked={showActiveOnly}
                    onChange={e => onShowActiveOnlyChange(e.target.checked)}
                    colorScheme="green"
                  >
                    <Text fontSize="md">Active rewards only</Text>
                  </Checkbox>
                  <Checkbox
                    isChecked={showDistributorOnly}
                    onChange={e => onShowDistributorOnlyChange(e.target.checked)}
                    colorScheme="blue"
                    isDisabled={isDistributorDisabled}
                  >
                    <Text fontSize="md">Connected wallet as distributor</Text>
                  </Checkbox>
                </VStack>
              </Box>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Box>
    </Popover>
  );
}

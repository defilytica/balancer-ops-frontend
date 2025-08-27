import React from "react";
import {
  Box,
  Button,
  HStack,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { CalendarIcon } from "@chakra-ui/icons";
import {
  convertTimestampToLocalDateTime,
  getMinDateTime,
  convertDateTimeToTimestamp,
} from "@/lib/utils/datePickerUtils";

interface InjectorDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const InjectorDateTimePicker: React.FC<InjectorDateTimePickerProps> = ({
  value,
  onChange,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const popoverBg = useColorModeValue("white", "background.level1");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const formatTimestamp = (timestamp: string) => {
    if (timestamp === "0") return "Immediate start";
    try {
      return new Date(parseInt(timestamp) * 1000).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timestamp;
    }
  };

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timestamp = convertDateTimeToTimestamp(e.target.value);
    onChange(timestamp);
  };

  const handleClear = () => {
    onChange("0");
    onClose();
  };

  const displayValue = formatTimestamp(value || "0");

  return (
    <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement="bottom-start">
      <PopoverTrigger>
        <HStack spacing={2} align="center" cursor="pointer">
          <Text fontSize="sm">{displayValue}</Text>
          <CalendarIcon color="gray.400" boxSize="14px" />
        </HStack>
      </PopoverTrigger>
      <PopoverContent
        bg={popoverBg}
        borderColor={borderColor}
        shadow="xl"
        width="320px"
        borderRadius="lg"
      >
        <PopoverArrow bg={popoverBg} />
        <PopoverBody p={5}>
          <VStack spacing={4} align="stretch">
            <Text
              fontSize="md"
              fontWeight="semibold"
              color={useColorModeValue("gray.700", "gray.200")}
            >
              Schedule Start Time
            </Text>
            <Box>
              <Text fontSize="xs" mb={2} color={useColorModeValue("gray.600", "gray.400")}>
                When should this reward distribution begin?
              </Text>
              <Input
                type="datetime-local"
                value={convertTimestampToLocalDateTime(value || "0")}
                onChange={handleDateTimeChange}
                min={getMinDateTime()}
                size="sm"
                bg={useColorModeValue("gray.50", "gray.700")}
                borderColor={useColorModeValue("gray.200", "gray.600")}
                _focus={{
                  borderColor: useColorModeValue("blue.500", "blue.300"),
                  bg: useColorModeValue("white", "gray.800"),
                }}
              />
            </Box>
            <HStack justify="space-between" spacing={3}>
              <Button size="sm" variant="ghost" onClick={handleClear} colorScheme="gray" flex={1}>
                Start Immediately
              </Button>
              <Button size="sm" variant="outline" onClick={onClose} flex={1}>
                Confirm
              </Button>
            </HStack>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

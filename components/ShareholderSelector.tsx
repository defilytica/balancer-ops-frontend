import {
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  List,
  ListItem,
  Flex,
  Box,
  useColorModeValue,
  IconButton,
} from "@chakra-ui/react";
import { useState } from "react";
import { BufferShareholder } from "@/lib/services/fetchBufferShareholders";
import { isAddress } from "viem";
import { FaList } from "react-icons/fa";


interface ShareholderSelectorProps {
  shareholders: BufferShareholder[];
  onSelect: (address: string) => void;
  selectedAddress?: string;
  placeholder?: string;
  isDisabled?: boolean;
}

export const ShareholderSelector = ({
  shareholders,
  onSelect,
  selectedAddress,
  placeholder = "Enter Safe address",
  isDisabled = false,
}: ShareholderSelectorProps) => {
  const hoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const amountTextColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.400", "gray.600");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [manualAddress, setManualAddress] = useState(selectedAddress || "");

  const handleSelect = (address: string) => {
    setManualAddress(address);
    onSelect(address);
    onClose();
  };

  const handleManualInput = (value: string) => {
    setManualAddress(value);
    onSelect(value);
  };

  return (
    <>
      <Flex gap={2}>
        <InputGroup flex="1">
          <Input
            value={manualAddress}
            onChange={e => handleManualInput(e.target.value)}
            placeholder={placeholder}
            isDisabled={isDisabled}
          />
          {manualAddress.length >= 42 && (
            <InputRightElement>
              <Text fontSize="sm" color={isAddress(manualAddress) ? "green.500" : "red.500"}>
                {isAddress(manualAddress) ? "✓" : "✗"}
              </Text>
            </InputRightElement>
          )}
        </InputGroup>

        {shareholders.length > 0 && (
          <IconButton
            aria-label="Select from existing shareholders"
            icon={<FaList />}
            onClick={!isDisabled ? onOpen : undefined}
            isDisabled={isDisabled}
            variant="outline"
            borderColor={borderColor}
            opacity={0.7}
            _hover={{ opacity: 1 }}
          />
        )}
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Shareholder</ModalHeader>
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color={amountTextColor}>
                Choose from existing shareholders with balances in this buffer:
              </Text>

              <List
                spacing={0}
                maxH="400px"
                overflowY="auto"
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="md"
              >
                {shareholders.map((shareholder, index) => (
                  <ListItem
                    key={shareholder.user.id}
                    onClick={() => handleSelect(shareholder.user.id)}
                    p={4}
                    cursor="pointer"
                    borderBottomWidth={index < shareholders.length - 1 ? "1px" : "0"}
                    borderBottomColor={borderColor}
                    bg={
                      manualAddress.toLowerCase() === shareholder.user.id.toLowerCase()
                        ? hoverBg
                        : "transparent"
                    }
                    _hover={{ bg: hoverBg }}
                  >
                    <Flex justifyContent="space-between" alignItems="center" gap={4}>
                      <Box flex="1" minW="0">
                        <Text
                          fontSize="sm"
                          fontFamily="mono"
                          isTruncated
                          fontWeight={
                            manualAddress.toLowerCase() === shareholder.user.id.toLowerCase()
                              ? "semibold"
                              : "normal"
                          }
                        >
                          {shareholder.user.id}
                        </Text>
                      </Box>
                      <Text fontSize="sm" fontWeight="semibold" color={amountTextColor}>
                        {parseFloat(shareholder.balance) < 0.01
                          ? "< 0.01"
                          : parseFloat(shareholder.balance).toFixed(2)}
                      </Text>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

import React, { useState, useEffect } from "react";
import { Input, InputGroup, InputRightElement, Tooltip, IconButton } from "@chakra-ui/react";
import { CheckIcon, WarningIcon, CopyIcon } from "@chakra-ui/icons";
import { isAddress } from "ethers";

interface AddressInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
}

const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  placeholder = "0x...",
  isDisabled = false,
  isRequired = false,
}) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!value) {
      setIsValid(null);
      return;
    }

    // Special case for zero address (allows anyone to upkeep)
    if (value === "0x0000000000000000000000000000000000000000") {
      setIsValid(true);
      return;
    }

    // Check if the address is valid
    setIsValid(isAddress(value));
  }, [value]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <InputGroup size="md">
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isRequired={isRequired}
        isInvalid={isValid === false}
        pr="4.5rem"
        fontFamily="monospace"
      />
      <InputRightElement width="4.5rem">
        {value && (
          <>
            <IconButton
              h="1.75rem"
              size="sm"
              aria-label="Copy address"
              icon={<CopyIcon />}
              onClick={handleCopy}
              mr={1}
            />
            {isValid === true ? (
              <Tooltip label="Valid address">
                <CheckIcon color="green.500" />
              </Tooltip>
            ) : isValid === false ? (
              <Tooltip label="Invalid address format">
                <WarningIcon color="red.500" />
              </Tooltip>
            ) : null}
          </>
        )}
      </InputRightElement>
    </InputGroup>
  );
};

export default AddressInput;

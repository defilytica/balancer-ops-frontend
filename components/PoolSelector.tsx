import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  List,
  ListItem,
  Spinner,
  Text,
  InputGroup,
  InputRightElement,
  IconButton,
  Badge,
  HStack,
  VStack,
  Alert,
  AlertIcon,
  AlertDescription,
  useOutsideClick,
  useColorModeValue,
} from "@chakra-ui/react";
import { CloseIcon, SearchIcon } from "@chakra-ui/icons";
import { Pool } from "@/types/interfaces";
import { ApolloError } from "@apollo/client";
import { GetPoolsQuery } from "@/lib/services/apollo/generated/graphql";
import { colors } from "@/lib/services/chakra/themes/base/colors";

interface PoolSelectorProps {
  pools: GetPoolsQuery["poolGetPools"] | undefined;
  loading: boolean;
  error: ApolloError | undefined;
  selectedPool: Pool | null;
  onPoolSelect: (pool: Pool) => void;
  onClearSelection: () => void;
}

const PoolSelector = ({
  pools,
  loading,
  error,
  selectedPool,
  onPoolSelect,
  onClearSelection,
}: PoolSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Color modes
  const dropdownBgColor = useColorModeValue("white", "gray.700");
  const hoverBgColor = useColorModeValue("gray.100", "gray.600");

  // Close dropdown when clicking outside
  useOutsideClick({
    ref: selectorRef,
    handler: () => setIsDropdownOpen(false),
  });

  // Filter pools based on search term
  const filteredPools = pools
    ? pools.filter(
        pool =>
          pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pool.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pool.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  // Focus on input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      const inputElement = document.getElementById("pool-search-input");
      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [isDropdownOpen]);

  // Format pool display
  const formatPoolDisplay = (pool: any) => {
    const hasGauge = pool.staking?.gauge?.id != null;
    return (
      <HStack justify="space-between" width="100%">
        <Text isTruncated maxW="60%">
          {pool.name}
        </Text>
        <HStack spacing={2}>
          {hasGauge && (
            <Badge colorScheme="blue" fontSize="xs">
              Has Gauge
            </Badge>
          )}
          <Text color="blue.500" fontSize="sm">
            {pool.address.slice(0, 6)}...{pool.address.slice(-4)}
          </Text>
        </HStack>
      </HStack>
    );
  };

  const handleInputClick = () => {
    if (!selectedPool) {
      setIsDropdownOpen(true);
    }
  };

  return (
    <FormControl>
      <FormLabel>Pool</FormLabel>
      <Box position="relative" ref={selectorRef}>
        <InputGroup>
          <Input
            id="pool-search-input"
            value={isDropdownOpen ? searchTerm : selectedPool ? selectedPool.name : ""}
            placeholder={loading ? "Indexing pools..." : "Search and select a pool"}
            onClick={handleInputClick}
            onChange={e => setSearchTerm(e.target.value)}
            readOnly={!isDropdownOpen}
            isDisabled={loading}
            _focus={{
              borderColor: "blue.500",
              boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
            }}
          />
          <InputRightElement>
            {selectedPool ? (
              <IconButton
                aria-label="Clear selection"
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                onClick={e => {
                  e.stopPropagation();
                  onClearSelection();
                  setSearchTerm("");
                }}
              />
            ) : loading ? (
              <Spinner size="sm" color="gray.400" />
            ) : (
              <SearchIcon color="blue.400" />
            )}
          </InputRightElement>
        </InputGroup>

        {/* Dropdown content */}
        {isDropdownOpen && !selectedPool && (
          <Box
            position="absolute"
            zIndex="dropdown"
            width="100%"
            mt={1}
            borderRadius="md"
            boxShadow="lg"
            bg={dropdownBgColor}
            borderWidth="1px"
            maxH="300px"
            overflowY="auto"
            css={{
              "&::-webkit-scrollbar": {
                width: "4px",
              },
              "&::-webkit-scrollbar-track": {
                width: "6px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "var(--chakra-colors-blue-100)",
                borderRadius: "24px",
              },
            }}
          >
            {loading ? (
              <VStack py={4}>
                <Spinner color="blue.500" />
                <Text>Indexing pools...</Text>
              </VStack>
            ) : error ? (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : filteredPools.length === 0 ? (
              <Text textAlign="center" py={4}>
                No pools found
              </Text>
            ) : (
              <List>
                {filteredPools.map(pool => (
                  <ListItem
                    key={pool.address}
                    onClick={() => {
                      onPoolSelect(pool as unknown as Pool);
                      setIsDropdownOpen(false);
                      setSearchTerm("");
                    }}
                    cursor="pointer"
                    _hover={{ bg: hoverBgColor }}
                    p={3}
                    borderBottomWidth="1px"
                    borderBottomColor="gray.500"
                    transition="background-color 0.2s"
                  >
                    {formatPoolDisplay(pool)}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </Box>
    </FormControl>
  );
};

export default PoolSelector;

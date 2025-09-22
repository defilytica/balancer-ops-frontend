import React from "react";
import {
  FormControl,
  FormLabel,
  Flex,
  Image,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { ChevronDown } from "react-feather";

interface NetworkOption {
  chainId: string;
  apiID: string;
  label: string;
}

interface NetworkInfo {
  logo: string;
  rpc: string;
  explorer: string;
  chainId: string;
}

interface NetworkSelectorProps {
  networks: Record<string, NetworkInfo>;
  networkOptions: NetworkOption[];
  selectedNetwork: string;
  handleNetworkChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  networks,
  networkOptions,
  selectedNetwork,
  handleNetworkChange,
  label,
}) => {
  // Create a synthetic event for our custom handler
  const createSyntheticEvent = (value: string) => {
    return {
      target: { value },
      currentTarget: { value },
      preventDefault: () => {},
    } as React.ChangeEvent<HTMLSelectElement>;
  };

  // Handle network selection from our custom dropdown
  const onSelectNetwork = (apiID: string) => {
    const syntheticEvent = createSyntheticEvent(apiID);
    handleNetworkChange(syntheticEvent);
  };

  // Function to find network key by apiID
  const getNetworkKeyByApiID = (apiID: string): string => {
    // Convert apiID to lowercase to match network keys
    const normalizedApiID = apiID.toLowerCase();

    // Special case for MAINNET -> ethereum/mainnet
    if (normalizedApiID === "mainnet") return "ethereum";

    // Find the matching network
    return Object.keys(networks).find(key => key.toLowerCase() === normalizedApiID) || "";
  };

  // Render a network option with logo
  const renderNetworkOption = (apiID: string) => {
    const networkKey = getNetworkKeyByApiID(apiID);
    const networkInfo = networks[networkKey];
    const networkLabel = networkOptions.find(option => option.apiID === apiID)?.label || apiID;

    return (
      <Flex alignItems="center">
        {networkInfo && <Image src={networkInfo.logo} alt={networkLabel} boxSize="20px" mr={2} />}
        <Text>{networkLabel}</Text>
      </Flex>
    );
  };

  return (
    <FormControl>
      {label && <FormLabel>{label}</FormLabel>}
      <Menu>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDown size={15} />}
          width="100%"
          borderWidth="1px"
          justifyContent="space-between"
          textAlign="left"
          fontWeight="normal"
          height="40px"
        >
          {selectedNetwork ? renderNetworkOption(selectedNetwork) : "Select Network"}
        </MenuButton>
        <MenuList width="100%" zIndex={1500}>
          {networkOptions.map(network => (
            <MenuItem
              key={network.chainId + network.apiID}
              onClick={() => onSelectNetwork(network.apiID)}
              bg={selectedNetwork === network.apiID ? "gray.600" : "transparent"}
            >
              {renderNetworkOption(network.apiID)}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </FormControl>
  );
};

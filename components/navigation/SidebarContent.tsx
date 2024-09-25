import React from "react";
import {
  Box,
  CloseButton,
  Flex,
  useColorModeValue,
  Heading,
  BoxProps,
  Link,
  Image,
  Badge,
} from "@chakra-ui/react";
import { FiHome } from "react-icons/fi";
import { SiChainlink } from "react-icons/si";
import { RiAlertLine, RiContractLine } from "react-icons/ri";
import { TbTransactionBitcoin } from "react-icons/tb";
import NavItem from "./NavItem";
import { BalancerLogo } from "@/public/imgs/BalancerLogo";

interface SidebarProps extends BoxProps {
  onClose: () => void;
}

const LinkItems = [
  {
    name: "Home",
    icon: FiHome,
    target: "/",
    description: "Navigate back to Home",
  },
  {
    name: "Payload Builder",
    icon: TbTransactionBitcoin,
    target: "/payload-builder",
    description:
      "Choose from a variety of options to create Balancer DAO Payloads",
  },
  {
    name: "Rewards Injector",
    icon: RiContractLine,
    target: "/rewards-injector",
    description: "View and Configure Gauge Rewards injectors",
  },
  {
    name: "Injector Status",
    icon: RiAlertLine,
    target: "/rewards-injector/status",
    description: "Check Injector status",
  },
  {
    name: "Automation Catalog",
    icon: SiChainlink,
    target: "/chainlink-automation",
    description: "View Chainlink Automation Upkeeps",
  },
];

const DRPCBanner = () => (
  <Link href="https://drpc.org?ref=974b0e" isExternal>
    <Box
      shadow="md"
      borderRadius="md"
      overflow="hidden"
      transition="all 0.1s"
      _hover={{
        shadow: "lg",
        transform: "translateY(-2px)",
      }}
    >
      <Image
        src="https://drpc.org/images/external/powered-by-drpc-dark.svg"
        alt="Powered by dRPC"
        width="218px"
        height="54px"
      />
    </Box>
  </Link>
);

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  return (
    <Box
      bg={useColorModeValue("#EFEDE6", "#393E48")}
      borderRight="2px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Flex alignItems="center">
          <Box boxSize={30} marginRight={2}>
            <BalancerLogo />
          </Box>
          <Box>
            <Heading as="h5" size="md" variant="special">
              Ops Tooling
            </Heading>
          </Box>
        </Flex>
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      {LinkItems.map((link) => (
        <NavItem
          key={link.name}
          icon={link.icon}
          target={link.target}
          onClose={onClose}
        >
          {link.name}
        </NavItem>
      ))}
      <Flex
        position="absolute"
        bottom="5"
        width="100%"
        justifyContent="center"
        flexDirection="column"
        alignItems="center"
      >
        <Badge
          colorScheme="purple"
          mb={4}
          fontSize="0.8em"
          borderRadius="full"
          px={2}
        >
          Alpha release
        </Badge>
        <DRPCBanner />
      </Flex>
    </Box>
  );
};

export default SidebarContent;

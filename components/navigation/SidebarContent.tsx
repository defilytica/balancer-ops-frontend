import React from "react";
import {
  Box,
  Text,
  CloseButton,
  Flex,
  Heading,
  BoxProps,
  Link,
  Image,
  Badge,
} from "@chakra-ui/react";
import { FiHome } from "react-icons/fi";
import { FaRegChartBar } from "react-icons/fa6";
import { SiChainlink } from "react-icons/si";
import { RiAlertLine, RiContractLine } from "react-icons/ri";
import { TbTransactionBitcoin, TbGaugeFilled } from "react-icons/tb";
import { MdPool } from "react-icons/md";
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
    description: "Choose from a variety of options to create Balancer DAO Payloads",
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
  {
    name: "Pool Creator (v2)",
    icon: MdPool,
    target: "/pool-creator-v2",
    description: "Create weighted and composable stable pools for Balancer v2",
  },
  {
    name: "Gauge Creator",
    icon: TbGaugeFilled,
    target: "/gauge-creator",
    description: "Create a staking gauge for Balancer pools",
  },
  {
    name: "Liquidity Buffers",
    icon: FaRegChartBar,
    target: "/liquidity-buffers",
    description: "View liquidity buffer allocations",
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
        width="190px"
        height="47px"
      />
    </Box>
  </Link>
);

const DefilyticaBanner = () => (
  <Link href="https://defilytica.com" isExternal>
    <Box
      mt={3}
      shadow="md"
      borderRadius="md"
      overflow="hidden"
      transition="all 0.1s"
      p={2} // Added padding for better spacing
      display="flex"
      alignItems="center"
      gap={2} // Add space between logo and text
      bg="purple.950"
      _hover={{
        shadow: "lg",
        transform: "translateY(-2px)",
      }}
    >
      <Image
        src="/imgs/defilytica.png"
        alt="DeFilytica"
        width="24px"
        height="24px"
        objectFit="contain"
      />
      <Text fontSize="sm" fontWeight="medium" variant="special">
        Developed by DeFilytica
      </Text>
    </Box>
  </Link>
);

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  return (
    <Box
      borderRight="2px"
      borderRightColor="gray.700"
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
      {LinkItems.map(link => (
        <NavItem key={link.name} icon={link.icon} target={link.target} onClose={onClose}>
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
        <Badge colorScheme="purple" mb={4} fontSize="0.8em" borderRadius="full" px={2}>
          Beta release
        </Badge>
        <DRPCBanner />
        <DefilyticaBanner />
      </Flex>
    </Box>
  );
};

export default SidebarContent;

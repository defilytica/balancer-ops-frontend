import React, { useState } from "react";
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
  Link as ChakraLink,
} from "@chakra-ui/react";
import { FaRegChartBar } from "react-icons/fa6";
import { SiChainlink } from "react-icons/si";
import { RiAlertLine, RiContractLine } from "react-icons/ri";
import {
  TbTransactionBitcoin,
  TbGaugeFilled,
  TbHeartRateMonitor,
  TbFishHook,
} from "react-icons/tb";
import { PiRocketLaunchBold } from "react-icons/pi";
import { MdPool } from "react-icons/md";
import NavItem, { NavItemType } from "./NavItem";
import { BalancerLogo } from "@/public/imgs/BalancerLogo";
import NextLink from "next/link";
interface SidebarProps extends BoxProps {
  onClose: () => void;
}

const LinkItems = [
  {
    name: "Payload Builder",
    icon: TbTransactionBitcoin,
    target: "/payload-builder",
    description: "Choose from a variety of options to create Balancer DAO Payloads",
  },
  {
    name: "Rewards Injector",
    icon: RiContractLine,
    children: [
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
        name: "Deploy New Injector",
        icon: PiRocketLaunchBold,
        target: "/injector-creator-v2",
        description: "Deploy a new rewards injector",
      },
    ],
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
    name: "Chainlink Automation",
    icon: SiChainlink,
    target: "/chainlink-automation",
    description: "View Chainlink Automation Upkeeps",
  },
  {
    name: "Liquidity Buffers",
    icon: FaRegChartBar,
    target: "/liquidity-buffers",
    description: "View liquidity buffer allocations",
  },
  {
    name: "Gauge Monitoring",
    icon: TbHeartRateMonitor,
    target: "/gauge-kill-list",
    description: "Check for gauge kill-list",
  },
  {
    name: "Hooks",
    icon: TbFishHook,
    target: "/hooks",
    description: "View and configure hooks",
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
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  const toggleItem = (itemName: string) => {
    setOpenItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const renderNavItem = (item: NavItemType, isSubItem = false) => {
    const hasSubItems = item.children && item.children.length > 0;
    const isOpen = openItems[item.name];

    return (
      <div key={item.name}>
        <NavItem
          icon={item.icon}
          title={item.name}
          target={item.target || "/"} // Ensure target always has a value
          onClose={onClose}
          hasSubItems={hasSubItems}
          isSubItem={isSubItem}
          isOpen={isOpen}
          onToggle={() => toggleItem(item.name)}
        />

        {hasSubItems && isOpen && (
          <div>{item.children?.map(child => renderNavItem(child, true))}</div>
        )}
      </div>
    );
  };

  return (
    <Box w={{ base: "full", md: 72 }} pos="fixed" h="full" {...rest}>
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Flex alignItems="center">
          <Box boxSize={30} marginRight={2}>
            <ChakraLink
              as={NextLink}
              href="/" // Explicit href for the logo
              style={{ textDecoration: "none" }}
              _focus={{ boxShadow: "none" }}
            >
              <BalancerLogo />
            </ChakraLink>
          </Box>
          <Box>
            <ChakraLink
              as={NextLink}
              href="/" // Explicit href for the heading
              style={{ textDecoration: "none" }}
              _focus={{ boxShadow: "none" }}
            >
              <Heading as="h5" size="md" variant="special">
                Ops Tooling
              </Heading>
            </ChakraLink>
          </Box>
        </Flex>
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>

      {LinkItems.map(item => renderNavItem(item))}

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

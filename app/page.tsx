import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Container,
  Grid,
  GridItem,
  Link,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  TbTransactionBitcoin,
  TbGaugeFilled,
  TbChartBar,
  TbTemplate,
  TbActivity,
} from "react-icons/tb";
import { MdPool } from "react-icons/md";
import { RiAlertLine, RiContractLine } from "react-icons/ri";
import { FaRegChartBar } from "react-icons/fa6";

export default function Page() {
  const sections = [
    {
      title: "Incentive Management",
      description: (
        <>
          Create and manage a secondary reward token program on Balancer. Check out the{" "}
          <Link
            href="https://docs.balancer.fi/partner-onboarding/onboarding-overview/incentive-management.html#secondary-reward-token-incentives"
            color="blue.500"
            isExternal
          >
            Docs
          </Link>{" "}
          for more information.
        </>
      ),
      features: [
        {
          title: "Create a Pool",
          icon: MdPool,
          description: "Set up a new Balancer (v2) Pool",
          primaryAction: {
            label: "Create Pool",
            href: "/pool-creator-v2",
          },
        },
        {
          title: "Create a Gauge",
          icon: TbGaugeFilled,
          description: "Create a staking gauge for Balancer pools",
          primaryAction: {
            label: "Create Gauge",
            href: "/gauge-creator",
          },
        },
        {
          title: "Create a Rewards Injector Program",
          icon: RiContractLine,
          description: "Create a rewards injector program for Balancer pools",
          primaryAction: {
            label: "Create Injector",
            href: "/rewards-injector",
          },
        },
      ],
    },
    {
      title: "Governance and Tooling",
      description: (
        <>
          Create DAO payloads, create or enable gauges or perform other operations for the DAO by submitting pull-requests to the multi-sig operations repository for execution.
        </>),
      features: [
        {
          title: "Create DAO Payloads",
          icon: TbTransactionBitcoin,
          description:
            "Build governance proposals and manage DAO operations with our intuitive payload builder",
          primaryAction: {
            label: "Create Payload",
            href: "/payload-builder",
          },
        },
        {
          title: "Create a Staking Gauge",
          icon: TbGaugeFilled,
          description:
            "Create a staking gauge for Balancer pools",
          primaryAction: {
            label: "Create Gauges",
            href: "/gauge-creator",
          },
        },
        {
          title: "Initialize Buffers",
          icon: FaRegChartBar,
          description:
            "Initialize Buffers for v3 pools",
          primaryAction: {
            label: "Initialize buffers",
            href: "/payload-builder/initialize-buffer",
          },
        },
      ],
    },
    {
      title: "Monitoring",
      description: (
        <>
          Check the status of critical infrastructure such as Chainlink upkeeps, injector programs or liquidity buffers.
        </>),
      features: [
        {
          title: "Chainlink Automation",
          icon: TbActivity,
          description: "Monitor funding status of upkeeps managed by the Balancer Maxis",
          primaryAction: {
            label: "View Upkeeps",
            href: "/chainlink-automation",
          },
        },
        {
          title: "Injector Program Status",
          icon: RiAlertLine,
          description: "Monitor Injectors funds, rewards and more.",
          primaryAction: {
            label: "View Status",
            href: "/rewards-injector/status",
          },
        },
        {
          title: "Liquidity Buffer Status",
          icon: FaRegChartBar,
          description: "Monitor Balancer v3 Liquidity Buffers.",
          primaryAction: {
            label: "View Buffers",
            href: "/liquidity-buffers",
          },
        },
      ],
    },
  ];

  return (
    <Box minHeight="100vh">
      <Container maxW="container.xl" pt={{ base: 4, md: 8 }}>
        <VStack spacing={2} textAlign="center">
          <Heading 
            as="h1" 
            p={2} 
            size={{ base: "xl", md: "2xl", lg: "3xl" }} 
            variant="special" 
            fontWeight="bold"
          >
            Welcome to Balancer Ops Tooling
          </Heading>
          <Text fontSize={{ base: "lg", md: "xl" }} variant="secondary">
            Streamlining Balancer DAO operations with our powerful suite of tools
          </Text>
        </VStack>
      </Container>

      {/* Sections */}
      <Container maxW="container.xl" mt={{ base: 8, md: 12 }}>
        <VStack spacing={{ base: 12, md: 16 }}>
          {sections.map((section, sectionIndex) => (
            <Box key={sectionIndex} width="100%">
              <VStack spacing={6} textAlign="center" mb={{ base: 6, md: 8 }}>
                <Heading as="h2" size={{ base: "md", md: "lg" }}>
                  {section.title}
                </Heading>
                <Text 
                  fontSize={{ base: "sm", md: "md" }} 
                  maxW="container.md" 
                  mx="auto"
                  px={4}
                >
                  {section.description}
                </Text>
              </VStack>

              <SimpleGrid 
                columns={{ base: 1, md: 2, lg: 3 }} 
                spacing={{ base: 4, md: 6, lg: 8 }}
                px={{ base: 4, md: 0 }}
              >
                {section.features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Box
                      key={index}
                      borderWidth="1px"
                      borderRadius="lg"
                      p={{ base: 4, md: 6 }}
                      _hover={{ shadow: "lg" }}
                      transition="box-shadow 0.2s"
                    >
                      <VStack
                        spacing={4}
                        align="center"
                        height="100%"
                        width="100%"
                        justify="space-between"
                      >
                        <VStack spacing={4} align="center">
                          <Icon size={32} />
                          <Heading size={{ base: "sm", md: "md" }}>{feature.title}</Heading>
                          <Text 
                            textAlign="center"
                            fontSize={{ base: "sm", md: "md" }}
                          >
                            {feature.description}
                          </Text>
                        </VStack>

                        <Button
                          variant="primary"
                          width="100%"
                          as={Link}
                          style={{ textDecoration: "none" }}
                          href={feature.primaryAction.href}
                          size={{ base: "md", md: "lg" }}
                        >
                          {feature.primaryAction.label}
                        </Button>
                      </VStack>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>
          ))}
        </VStack>
      </Container>
    </Box>
  );
}

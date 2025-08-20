import React, { useState, useEffect } from "react";
import ReactConfetti from "react-confetti";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  Link,
  HStack,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";

interface LiquidityAddedModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId: string;
  poolAddress: string;
  networkName?: string;
}

export const LiquidityAddedModal = ({
  isOpen,
  onClose,
  poolId,
  poolAddress,
  networkName,
}: LiquidityAddedModalProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  // Convert network name to Balancer URL format
  const getBalancerNetworkPath = (network?: string): string => {
    if (!network) return "ethereum";
    const networkLower = network.toLowerCase();
    switch (networkLower) {
      case "mainnet":
        return "ethereum";
      case "polygon":
        return "polygon";
      case "arbitrum":
        return "arbitrum";
      case "optimism":
        return "optimism";
      case "gnosis":
        return "gnosis";
      case "base":
        return "base";
      case "avalanche":
        return "avalanche";
      case "zkevm":
        return "zkevm";
      case "fraxtal":
        return "fraxtal";
      case "mode":
        return "mode";
      default:
        return "ethereum";
    }
  };

  const poolUrl = `https://balancer.fi/pools/${getBalancerNetworkPath(networkName)}/v2/${poolId}`;

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} size="xl">
      <ModalOverlay />
      <ModalContent position="relative">
        {showConfetti && (
          <ReactConfetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
          />
        )}
        <ModalHeader>Liquidity Added Successfully!</ModalHeader>
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              You have successfully added liquidity to the pool!
            </Alert>
            <Box borderWidth="1px" borderRadius="lg" p={4}>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontWeight="semibold" fontSize="sm">
                    Pool ID
                  </Text>
                  <Text fontSize="md" fontFamily="mono" mt={1} wordBreak="break-all">
                    {poolId}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" fontSize="sm">
                    Pool Address
                  </Text>
                  <Text fontSize="md" fontFamily="mono" mt={1} wordBreak="break-all">
                    {poolAddress}
                  </Text>
                </Box>
                <Alert status="info" size="sm">
                  <AlertIcon />
                  Save these details for future reference
                </Alert>
              </VStack>
            </Box>
            <Box borderWidth="1px" borderRadius="lg" p={4} bg="purple.50" _dark={{ bg: "purple.900" }}>
              <VStack align="stretch" spacing={2}>
                <Text fontWeight="semibold" fontSize="sm">
                  View Your Pool
                </Text>
                <Link href={poolUrl} isExternal color="purple.600" _dark={{ color: "purple.300" }}>
                  <HStack>
                    <Text fontSize="sm">View on Balancer</Text>
                    <ExternalLinkIcon />
                  </HStack>
                </Link>
                <Text fontSize="xs" color="gray.600" _dark={{ color: "gray.400" }}>
                  Network: {networkName || "Unknown"}
                </Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

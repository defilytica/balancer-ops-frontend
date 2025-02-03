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
} from "@chakra-ui/react";

interface LiquidityAddedModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId: string;
  poolAddress: string;
}

export const LiquidityAddedModal = ({
  isOpen,
  onClose,
  poolId,
  poolAddress,
}: LiquidityAddedModalProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

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
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

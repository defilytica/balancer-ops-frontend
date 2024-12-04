import { Alert, AlertIcon, Box, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

interface InitJoinModalProps {
    isOpen: boolean;
    onClose: () => void;
    poolId: string;
    poolAddress: string;
    isJoiningPool: boolean;
    onJoin: () => void;
}

export const InitJoinModal = ({ isOpen, onClose, onJoin, poolId, poolAddress, isJoiningPool }: InitJoinModalProps) => {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            closeOnOverlayClick={false}
            size="xl"
        >
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

                <ModalHeader>Join Pool</ModalHeader>
                <ModalBody>
                    <VStack spacing={6} align="stretch">
                        {[
                            <Alert key="alert" status="info" borderRadius="md">
                                <AlertIcon />
                                Your Pool has been created successfully!
                            </Alert>,
                            <Box key="pool-info" borderWidth="1px" borderRadius="lg" p={4} >
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
                                    <Alert status="warning" size="sm" mt={2}>
                                        <AlertIcon />
                                        Save these details for future reference
                                    </Alert>
                                </VStack>
                            </Box>
                        ]}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button
                        variant="ghost"
                        mr={3}
                        onClick={onClose}
                        isDisabled={isJoiningPool}
                    >
                        Later
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={onJoin}
                        isLoading={isJoiningPool}
                        loadingText="Joining Pool"
                    >
                        Add Initial Liquidity
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}
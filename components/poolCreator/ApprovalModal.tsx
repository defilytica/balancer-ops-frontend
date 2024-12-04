import { PoolConfig } from "@/types/interfaces";
import { Alert, AlertIcon, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spinner, Table, Tbody, Td, Th, Thead, Tr, VStack } from "@chakra-ui/react";
import { IoCheckmarkCircle, IoWarning } from "react-icons/io5";

interface ApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: PoolConfig;
    handleApprove: (tokenAddress: string) => Promise<void>;
    isJoiningPool: boolean;
    approvalStates: ApprovalStates;
    initJoinPool: () => void;
}

type ApprovalStates = Record<string, TokenApprovalState>;

interface TokenApprovalState {
    checking: boolean;
    needsApproval: boolean;
    approved: boolean;
    decimals?: number;
    error?: string;
}

export const ApprovalModal = ({ isOpen, onClose, config, approvalStates, handleApprove, isJoiningPool, initJoinPool }: ApprovalModalProps) => {

    const allTokensApproved = Object.values(approvalStates).every(
        state => state.approved && !state.checking
    );

    console.log(approvalStates)

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            closeOnOverlayClick={false}
            size="xl"
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Token Approvals Required</ModalHeader>
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Table variant="simple" size="sm">
                            <Thead>
                                <Tr>
                                    <Th>Token</Th>
                                    <Th>Amount</Th>
                                    <Th>Status</Th>
                                    <Th>Action</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {config.tokens.map((token, index) => {
                                    if (!token.address || !token.amount) return null;
                                    const state = approvalStates[token.address];

                                    return (
                                        <Tr key={token.address}>
                                            <Td>{token.symbol || 'Unknown'}</Td>
                                            <Td>{token.amount}</Td>
                                            <Td>
                                                {state?.checking ? (
                                                    <Spinner size="sm" />
                                                ) : state?.approved ? (
                                                    <IoCheckmarkCircle color="green" />
                                                ) : (
                                                    <IoWarning color="orange" />
                                                )}
                                            </Td>
                                            <Td>
                                                <Button
                                                    size="sm"
                                                    colorScheme={state?.approved ? 'green' : 'blue'}
                                                    isDisabled={state?.approved || state?.checking}
                                                    onClick={() => handleApprove(token.address!)}
                                                >
                                                    {state?.approved ? 'Approved' : 'Approve'}
                                                </Button>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </Tbody>
                        </Table>

                        {allTokensApproved && (
                            <Alert status="success">
                                <AlertIcon />
                                All tokens approved! Ready to create pool.
                            </Alert>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button
                        variant="ghost"
                        mr={3}
                        onClick={onClose}
                        isDisabled={isJoiningPool}
                    >
                        Cancel
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={initJoinPool}
                        isDisabled={!allTokensApproved || isJoiningPool}
                        isLoading={isJoiningPool}
                        loadingText="Joining Pool"
                    >
                        Initiate Join
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}
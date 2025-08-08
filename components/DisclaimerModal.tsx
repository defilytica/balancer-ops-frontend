"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  Alert,
  AlertIcon,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DisclaimerModal({ isOpen, onClose }: DisclaimerModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Important Disclaimer</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Alert status="warning">
              <AlertIcon />
              <Text fontWeight="bold">Self-Custody Application</Text>
            </Alert>

            <Text>
              This is a self-custody application that interfaces with decentralized protocols. By
              using this application, you acknowledge and agree that:
            </Text>

            <UnorderedList spacing={2}>
              <ListItem>
                <strong>You are solely responsible</strong> for all transactions and actions
                performed through this application
              </ListItem>
              <ListItem>
                <strong>You maintain full custody</strong> of your private keys and digital assets
                at all times
              </ListItem>
              <ListItem>
                <strong>No liability is assumed</strong> by the developers or maintainers of this
                application for any losses, errors, or damages
              </ListItem>
              <ListItem>
                <strong>Smart contract risks exist</strong> - always verify transactions and
                understand the protocols you interact with
              </ListItem>
              <ListItem>
                <strong>This software is provided "as is"</strong> without warranties of any kind
              </ListItem>
            </UnorderedList>

            <Text fontSize="sm" color="gray.500">
              Please ensure you understand the risks involved with DeFi protocols and blockchain
              transactions before proceeding. Always double-check transaction details before
              confirming.
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            I Understand and Accept
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

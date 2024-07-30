import React, {useState} from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    Textarea,
    useToast,
} from '@chakra-ui/react';
import {PAYLOAD_TYPES, REPO_OPTIONS} from "@/app/payload-builder/constants";
import {createPR} from "@/lib/shared/services/createPR";

interface PRCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    payload: any;
    type: keyof typeof PAYLOAD_TYPES;
}

export const PRCreationModal: React.FC<PRCreationModalProps> = ({
                                                                    isOpen,
                                                                    onClose,
                                                                    payload,
    type
                                                                }) => {
    const [prRepo, setPrRepo] = useState(REPO_OPTIONS[0]);
    const [prBranch, setPrBranch] = useState('');
    const [prName, setPrName] = useState('');
    const [prDescription, setPrDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const { branchNamePlaceholder, prNamePlaceholder } = PAYLOAD_TYPES[type];

    const handleCreatePR = async () => {
        setIsLoading(true);
        try {
            await createPR(prRepo, payload, prBranch, prName, prDescription, toast);
            onClose();
        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Create Pull Request</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl mb={4}>
                        <FormLabel>Repository</FormLabel>
                        <Select value={prRepo} onChange={(e) => setPrRepo(e.target.value)}>
                            {REPO_OPTIONS.map((repo) => (
                                <option key={repo} value={repo}>{repo}</option>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>Branch Name</FormLabel>
                        <Input
                            value={prBranch}
                            onChange={(e) => setPrBranch(e.target.value)}
                            placeholder={branchNamePlaceholder}
                        />
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>PR Name</FormLabel>
                        <Input
                            value={prName}
                            onChange={(e) => setPrName(e.target.value)}
                            placeholder={prNamePlaceholder}
                        />
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>PR Description</FormLabel>
                        <Textarea
                            value={prDescription}
                            onChange={(e) => setPrDescription(e.target.value)}
                            placeholder="Describe the changes in this PR..."
                        />
                    </FormControl>
                </ModalBody>

                <ModalFooter>
                    <Button
                        variant="primary"
                        mr={3}
                        onClick={handleCreatePR}
                        isLoading={isLoading}
                    >
                        Create PR
                    </Button>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
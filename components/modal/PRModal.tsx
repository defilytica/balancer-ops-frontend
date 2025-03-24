// Simplified PR Modal with pre-filled values
import React, { useEffect, useState } from "react";
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
  Text,
  useToast,
  Box,
  Flex,
  IconButton,
  FormErrorMessage,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
} from "@chakra-ui/react";
import { PAYLOAD_OPTIONS } from "@/constants/constants";
import { createPR } from "@/lib/services/createPR";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  getISOWeek,
  getYear,
  isBefore,
  isSameWeek,
} from "date-fns";

interface PRCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: any;
  type: string;
  network?: string;
  // New pre-filled props
  prefillBranchName?: string;
  prefillPrName?: string;
  prefillDescription?: string;
  prefillFilePath?: string;
}

interface ForkStatus {
  forkRepo: string;
  isOutdated: boolean;
  behindBy?: number;
}

const isValidBranchName = (name: string) => {
  const regex = /^(?!.*\.\.)[^\s~^:?*\\[]+(?<!\.lock)$/;
  return regex.test(name) && !name.startsWith("-") && !name.includes("@{");
};

// Get the start of next week (Monday)
const getStartOfNextWeek = () => {
  const now = new Date();
  // Start from current date, add days until we reach next Monday
  const daysUntilNextMonday = (8 - now.getDay()) % 7 || 7; // If today is Monday, go to next Monday
  return addDays(now, daysUntilNextMonday);
};

// Generate a unique ID to prevent branch conflicts
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
};

export const PRCreationModal: React.FC<PRCreationModalProps> = ({
                                                                  isOpen,
                                                                  onClose,
                                                                  payload,
                                                                  type,
                                                                  network,
                                                                  prefillBranchName,
                                                                  prefillPrName,
                                                                  prefillDescription,
                                                                  prefillFilePath,
                                                                }) => {
  const payloadOption = PAYLOAD_OPTIONS.find(option => option.key === type);
  const repoOptions = payloadOption ? payloadOption.repos : [];

  const [forkStatus, setForkStatus] = useState<ForkStatus | null>(null);
  const [prRepo, setPrRepo] = useState(repoOptions[0] || "");
  const [prBranch, setPrBranch] = useState("");
  const [prName, setPrName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(getStartOfNextWeek());
  const [branchError, setBranchError] = useState("");
  const toast = useToast();

  const { branchNamePlaceholder, prNamePlaceholder, prTypePath } = payloadOption || {};
  const needsWeekSelector = prTypePath?.includes("YYYY-WXX");

  // Initialize values when the modal opens or prefill values change
  useEffect(() => {
    if (isOpen) {
      // Set pre-filled values if provided, otherwise use defaults
      setPrBranch(prefillBranchName || `${branchNamePlaceholder || `feature/${type}`}-${generateUniqueId()}`);
      setPrName(prefillPrName || prNamePlaceholder || `${type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')}`);
      setPrDescription(prefillDescription || "");

      // Only set filePath if prefill not provided - we'll calculate it otherwise
      if (prefillFilePath) {
        setFilePath(prefillFilePath);
      }
    }
  }, [isOpen, prefillBranchName, prefillPrName, prefillDescription, prefillFilePath]);

  // Calculate file path based on week and type if not pre-filled
  useEffect(() => {
    if (!prefillFilePath && prTypePath) {
      const basePath = prTypePath;
      const year = getYear(selectedWeek);
      const weekNum = getISOWeek(selectedWeek);
      const weekStr = `W${weekNum}`;
      let newPath = basePath.replace("YYYY", year.toString()).replace("WXX", weekStr);

      if (network && newPath.includes("[chain]")) {
        newPath = newPath.replace("[chain]", network.toLowerCase());
      }

      setFilePath(`${newPath}${type}-${generateUniqueId()}.json`);
    }
  }, [type, selectedWeek, network, prefillFilePath, prTypePath]);

  useEffect(() => {
    setIsLoading(true);
    const checkForkStatus = async () => {
      if (!isOpen || !prRepo) return;

      try {
        const response = await fetch(`/api/github/check-status?repo=${prRepo}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const status = await response.json();
        setForkStatus(status);
      } catch (error) {
        console.error("Error checking fork status:", error);
        toast({
          title: "Error checking fork status",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkForkStatus();
  }, [isOpen, prRepo]);

  const handleWeekChange = (direction: "prev" | "next") => {
    if (direction === "next") {
      // Always allow going to future weeks
      setSelectedWeek(prev => addWeeks(prev, 1));
    } else {
      // For "prev", check if going back would result in current week or earlier
      const prevWeek = subWeeks(selectedWeek, 1);
      const now = new Date();

      // Only allow if the previous week is still in the future
      if (!isBefore(prevWeek, now) && !isSameWeek(prevWeek, now, { weekStartsOn: 1 })) {
        setSelectedWeek(prevWeek);
      } else {
        toast({
          title: "Invalid selection",
          description: "Only future weeks can be selected",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const isPrevButtonDisabled = () => {
    const prevWeek = subWeeks(selectedWeek, 1);
    const now = new Date();
    return isBefore(prevWeek, now) || isSameWeek(prevWeek, now, { weekStartsOn: 1 });
  };

  const formatWeekRange = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  const handleBranchNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrBranch(value);
    if (!isValidBranchName(value)) {
      setBranchError("Invalid branch name. Please check the naming rules.");
    } else {
      setBranchError("");
    }
  };

  const handleCreatePR = async () => {
    if (!filePath) {
      toast({
        title: "Error",
        description: "Please provide a file path",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await createPR({
        repo: prRepo,
        payload: payload,
        branchName: prBranch,
        title: prName,
        description: prDescription,
        filePath: filePath,
        toast,
      });
      onClose();
    } catch (error) {
      console.error("Error creating PR:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFork = async () => {
    const url = `https://github.com/${forkStatus?.forkRepo}`;
    window.open(url, "_blank");
  };

  const handleFilePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilePath(e.target.value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Pull Request</ModalHeader>
        <ModalCloseButton />
        {forkStatus?.isOutdated && (
          <Alert status="warning" mb={4}>
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Fork is outdated</AlertTitle>
              <AlertDescription display="block">
                Your fork is {forkStatus.behindBy} commits behind the main repository. Please update
                your fork before creating a PR.
              </AlertDescription>
              <Button size="sm" colorScheme="orange" mt={2} onClick={handleUpdateFork}>
                Update Fork
              </Button>
            </Box>
          </Alert>
        )}
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel>Repository</FormLabel>
            <Select value={prRepo} onChange={e => setPrRepo(e.target.value)}>
              {repoOptions.map(repo => (
                <option key={repo} value={repo}>
                  {repo}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl mb={4} isInvalid={!!branchError}>
            <FormLabel>Branch Name</FormLabel>
            <Input
              value={prBranch}
              onChange={handleBranchNameChange}
              placeholder={branchNamePlaceholder}
            />
            <FormErrorMessage>{branchError}</FormErrorMessage>
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>PR Name</FormLabel>
            <Input
              value={prName}
              onChange={e => setPrName(e.target.value)}
              placeholder={prNamePlaceholder}
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>PR Description</FormLabel>
            <Textarea
              value={prDescription}
              onChange={e => setPrDescription(e.target.value)}
              placeholder="Describe the changes in this PR..."
            />
          </FormControl>

          {needsWeekSelector && (
            <FormControl mb={4}>
              <FormLabel>Select Week of On-chain Execution</FormLabel>
              <Flex align="center" justify="space-between" bg="transparent" p={2} borderRadius="md">
                <IconButton
                  icon={<ChevronLeftIcon />}
                  onClick={() => handleWeekChange("prev")}
                  aria-label="Previous week"
                  size="md"
                  variant="ghost"
                  isDisabled={isPrevButtonDisabled()}
                  _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
                />
                <Box textAlign="center" flex={1}>
                  <Text fontWeight="bold">{formatWeekRange(selectedWeek)}</Text>
                  <Text fontSize="sm" color="gray.600">
                    Week {format(selectedWeek, "w")} of {format(selectedWeek, "yyyy")}
                  </Text>
                </Box>
                <IconButton
                  icon={<ChevronRightIcon />}
                  onClick={() => handleWeekChange("next")}
                  aria-label="Next week"
                  size="md"
                  variant="ghost"
                />
              </Flex>
            </FormControl>
          )}

          <FormControl mb={4}>
            <FormLabel>File Path</FormLabel>
            <Input
              value={filePath}
              onChange={handleFilePathChange}
              placeholder={`Enter or select a path for ${type}.json`}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="primary"
            mr={3}
            onClick={handleCreatePR}
            isLoading={isLoading}
            isDisabled={!!branchError}
          >
            Create PR
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

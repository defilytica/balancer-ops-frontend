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
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, getISOWeek, getYear } from "date-fns";

interface PRCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: any;
  type: string;
  network?: string;
}

const isValidBranchName = (name: string) => {
  const regex = /^(?!.*\.\.)[^\s~^:?*\\[]+(?<!\.lock)$/;
  return regex.test(name) && !name.startsWith("-") && !name.includes("@{");
};

interface ForkStatus {
  forkRepo: string;
  isOutdated: boolean;
  behindBy?: number;
}

export const PRCreationModal: React.FC<PRCreationModalProps> = ({
  isOpen,
  onClose,
  payload,
  type,
  network,
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
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [branchError, setBranchError] = useState("");
  const toast = useToast();

  const { branchNamePlaceholder, prNamePlaceholder } = payloadOption || {};
  const needsWeekSelector = payloadOption?.prTypePath.includes("YYYY-WXX");

  useEffect(() => {
    const basePath = payloadOption?.prTypePath || "";
    const year = getYear(selectedWeek);
    const weekNum = getISOWeek(selectedWeek);
    const weekStr = `W${weekNum}`;
    let newPath = basePath.replace("YYYY", year.toString()).replace("WXX", weekStr);

    if (network && newPath.includes("[chain]")) {
      newPath = newPath.replace("[chain]", network.toLowerCase());
    }

    setFilePath(`${newPath}${type}.json`);
  }, [type, selectedWeek, network]);

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
        console.log(status);
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
    setSelectedWeek(prev => (direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1)));
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
              <FormLabel>Select Week</FormLabel>
              <Flex align="center" justify="space-between" bg="transparent" p={2} borderRadius="md">
                <IconButton
                  icon={<ChevronLeftIcon />}
                  onClick={() => handleWeekChange("prev")}
                  aria-label="Previous week"
                  size="md"
                  variant="ghost"
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

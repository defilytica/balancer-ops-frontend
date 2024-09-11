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
} from "@chakra-ui/react";
import { PAYLOAD_TYPES, REPO_OPTIONS } from "@/constants/constants";
import { createPR } from "@/lib/services/createPR";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  getISOWeek,
  getYear,
} from "date-fns";

interface PRCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: any;
  type: keyof typeof PAYLOAD_TYPES;
  network?: string;
}

const isValidBranchName = (name: string) => {
  const regex = /^(?!.*\.\.)[^\s~^:?*\\[]+(?<!\.lock)$/;
  return regex.test(name) && !name.startsWith("-") && !name.includes("@{");
};

const PR_TYPE_PATHS = {
  "create-payment": "BIPs/YYYY-WXX/",
  "enable-gauge": "BIPs/YYYY-WXX/",
  "kill-gauge": "BIPs/YYYY-WXX/",
  "add-reward-to-gauge": "MaxiOps/add_rewards/[chain]/",
  "ccip-bridge": "MaxiOps/CCTP_Bridge/",
  "set-swapfee": "MaxiOps/PoolSwapFeeChanges/",
};

export const PRCreationModal: React.FC<PRCreationModalProps> = ({
  isOpen,
  onClose,
  payload,
  type,
  network,
}) => {
  const [prRepo, setPrRepo] = useState(REPO_OPTIONS[0]);
  const [prBranch, setPrBranch] = useState("");
  const [prName, setPrName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [branchError, setBranchError] = useState("");
  const toast = useToast();

  const { branchNamePlaceholder, prNamePlaceholder } = PAYLOAD_TYPES[type];
  const needsWeekSelector = PR_TYPE_PATHS[type].includes("YYYY-WXX");

  useEffect(() => {
    const basePath = PR_TYPE_PATHS[type] || "";
    const year = getYear(selectedWeek);
    const weekNum = getISOWeek(selectedWeek);
    const weekStr = weekNum < 10 ? `W0${weekNum}` : `W${weekNum}`;
    let newPath = basePath
      .replace("YYYY", year.toString())
      .replace("WXX", weekStr);

    if (network && newPath.includes("[chain]")) {
      newPath = newPath.replace("[chain]", network.toLowerCase());
    }

    setFilePath(`${newPath}${type}.json`);
  }, [type, selectedWeek, network]);

  const handleWeekChange = (direction: "prev" | "next") => {
    setSelectedWeek((prev) =>
      direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1),
    );
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

  const handleFilePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilePath(e.target.value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Pull Request</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel>Repository</FormLabel>
            <Select value={prRepo} onChange={(e) => setPrRepo(e.target.value)}>
              {REPO_OPTIONS.map((repo) => (
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

          {needsWeekSelector && (
            <FormControl mb={4}>
              <FormLabel>Select Week</FormLabel>
              <Flex
                align="center"
                justify="space-between"
                bg="transparent"
                p={2}
                borderRadius="md"
              >
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
                    Week {format(selectedWeek, "w")} of{" "}
                    {format(selectedWeek, "yyyy")}
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

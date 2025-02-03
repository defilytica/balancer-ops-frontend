import { useState } from "react";
import { Button, Textarea, Input, Stack } from "@chakra-ui/react";
import axios from "axios";

const SubmitPayload = () => {
  const [payload, setPayload] = useState("");
  const [filePath, setFilePath] = useState("");
  const [branchName, setBranchName] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [prUrl, setPrUrl] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/github/create-pr", {
        payload: JSON.parse(payload),
        filePath,
        branchName,
        title,
        base: "main", // assuming 'main' is the base branch, this can be adjusted as needed
      });
      setPrUrl(response.data.pr_url);
    } catch (error) {
      console.error("Error creating PR:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={4}>
      <Textarea
        value={payload}
        onChange={e => setPayload(e.target.value)}
        placeholder="Enter your JSON payload"
        size="sm"
      />
      <Input
        value={filePath}
        onChange={e => setFilePath(e.target.value)}
        placeholder="Enter the file path"
        size="sm"
      />
      <Input
        value={branchName}
        onChange={e => setBranchName(e.target.value)}
        placeholder="Enter the branch name"
        size="sm"
      />
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Enter the PR title"
        size="sm"
      />
      <Button onClick={handleSubmit} isLoading={loading} colorScheme="blue">
        Submit Payload
      </Button>
      {prUrl && (
        <a href={prUrl} target="_blank" rel="noopener noreferrer">
          View PR
        </a>
      )}
    </Stack>
  );
};

export default SubmitPayload;

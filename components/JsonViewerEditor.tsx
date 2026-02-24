import React, { useState } from "react";
import { Box, Button, Flex, Text, useColorMode, useToast } from "@chakra-ui/react";
import { CodeiumEditor } from "@codeium/react-code-editor";
import dynamic from "next/dynamic";

const ReactJson = dynamic(() => import("@microlink/react-json-view").then(mod => mod.default), {
  ssr: false,
});
import { BatchFile } from "@/components/btns/SimulateTransactionButton";

interface JsonViewerEditorProps {
  jsonData: string | BatchFile | null;
  onJsonChange: (newJson: string | BatchFile) => void;
}

export const JsonViewerEditor: React.FC<JsonViewerEditorProps> = ({ jsonData, onJsonChange }) => {
  const { colorMode } = useColorMode();
  const [isEditing, setIsEditing] = useState(false);
  const [localJsonString, setLocalJsonString] = useState("");
  const toast = useToast();

  if (!jsonData) return null;

  // Convert jsonData to string format for the editor
  const jsonString = typeof jsonData === "string" ? jsonData : JSON.stringify(jsonData, null, 2);

  const handleToggleEdit = () => {
    if (isEditing) {
      // When exiting edit mode, try to apply changes
      try {
        const parsedJson = JSON.parse(localJsonString);
        if (typeof jsonData === "string") {
          onJsonChange(JSON.stringify(parsedJson, null, 2));
        } else {
          onJsonChange(parsedJson as BatchFile);
        }
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Please ensure the edited JSON is valid",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        // Stay in edit mode if JSON is invalid
        return;
      }
    } else {
      // When entering edit mode, initialize local state
      setLocalJsonString(jsonString);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveEdit = () => {
    try {
      const parsedJson = JSON.parse(localJsonString);
      if (typeof jsonData === "string") {
        onJsonChange(JSON.stringify(parsedJson, null, 2));
      } else {
        onJsonChange(parsedJson as BatchFile);
      }
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please ensure the edited JSON is valid",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      // Just update local state during editing, don't parse yet
      setLocalJsonString(value);
    }
  };

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb="10px">
        <Text fontSize="lg">JSON Payload</Text>
        <Button onClick={handleToggleEdit}>
          {isEditing ? "Switch to Viewer" : "Switch to Editor"}
        </Button>
      </Flex>
      {isEditing ? (
        <CodeiumEditor
          height="400px"
          language="json"
          theme="vs-dark"
          value={localJsonString}
          onChange={handleEditorChange}
        />
      ) : (
        <ReactJson
          theme={colorMode === "light" ? "rjv-default" : "solarized"}
          src={typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData}
        />
      )}
      {isEditing && (
        <Button mt="10px" onClick={handleSaveEdit}>
          Save Changes
        </Button>
      )}
    </Box>
  );
};

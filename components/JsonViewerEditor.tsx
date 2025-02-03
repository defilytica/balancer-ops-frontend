import React, { useState } from "react";
import { Box, Button, Flex, Text, useColorMode, useToast } from "@chakra-ui/react";
import { CodeiumEditor } from "@codeium/react-code-editor";
import dynamic from "next/dynamic";
import { BatchFile } from "@/components/btns/SimulateTransactionButton";

const ReactJson = dynamic(() => import("react-json-view"), {
  ssr: false,
});

interface JsonViewerEditorProps {
  jsonData: string | BatchFile | null;
  onJsonChange: (newJson: string | BatchFile) => void;
}

export const JsonViewerEditor: React.FC<JsonViewerEditorProps> = ({ jsonData, onJsonChange }) => {
  const { colorMode } = useColorMode();
  const reactJsonTheme = colorMode === "light" ? "rjv-default" : "solarized";
  const [isEditing, setIsEditing] = useState(false);
  const toast = useToast();

  if (!jsonData) return null;

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveEdit = (editedValue: string) => {
    try {
      const parsedJson = JSON.parse(editedValue);
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
      if (typeof jsonData === "string") {
        onJsonChange(value);
      } else {
        try {
          const parsedJson = JSON.parse(value);
          onJsonChange(parsedJson as BatchFile);
        } catch (error) {
          // If parsing fails, we're dealing with incomplete JSON, so we don't update
        }
      }
    }
  };

  const jsonString = typeof jsonData === "string" ? jsonData : JSON.stringify(jsonData, null, 2);

  return (
    <Box mt="20px">
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
          value={jsonString}
          onChange={handleEditorChange}
        />
      ) : (
        <ReactJson
          theme={reactJsonTheme}
          src={typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData}
        />
      )}
      {isEditing && (
        <Button mt="10px" onClick={() => handleSaveEdit(jsonString)}>
          Save Changes
        </Button>
      )}
    </Box>
  );
};

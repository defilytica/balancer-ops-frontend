import { ButtonGroup, Button, useColorModeValue } from "@chakra-ui/react";

export enum ConfigMode {
  ADD = "add",
  REMOVE = "remove",
}

interface ConfigModeSwitcherProps {
  configMode: ConfigMode | null;
  onChange: (mode: ConfigMode) => void;
}

export const ConfigModeSwitcher = ({ configMode, onChange }: ConfigModeSwitcherProps) => {
  const borderColor = useColorModeValue("gray.600", "whiteAlpha.300");
  const hoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const activeBg = useColorModeValue("gray.100", "whiteAlpha.200");
  const activeColor = useColorModeValue("gray.800", "white");
  const inactiveColor = useColorModeValue("gray.600", "gray.400");

  return (
    <ButtonGroup size="lg" isAttached variant="outline">
      <Button
        onClick={() => onChange(ConfigMode.ADD)}
        bg={configMode === ConfigMode.ADD ? activeBg : "transparent"}
        borderColor={borderColor}
        color={configMode === ConfigMode.ADD ? activeColor : inactiveColor}
        _hover={{
          bg: hoverBg,
        }}
      >
        Add Recipients
      </Button>
      <Button
        onClick={() => onChange(ConfigMode.REMOVE)}
        bg={configMode === ConfigMode.REMOVE ? activeBg : "transparent"}
        borderColor={borderColor}
        color={configMode === ConfigMode.REMOVE ? activeColor : inactiveColor}
        _hover={{
          bg: hoverBg,
        }}
      >
        Remove Recipients
      </Button>
    </ButtonGroup>
  );
};

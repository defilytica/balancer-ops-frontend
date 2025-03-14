import { ButtonGroup, Button, Icon, useColorModeValue } from "@chakra-ui/react";
import { BsGrid, BsTable } from "react-icons/bs";

export enum ViewMode {
  CARD = "card",
  TABLE = "table",
}

interface ViewSwitcherProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewSwitcher = ({ viewMode, onChange }: ViewSwitcherProps) => {
  const iconColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const hoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const activeBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const activeColor = useColorModeValue("gray.800", "white");

  return (
    <ButtonGroup size="sm" isAttached>
      <Button
        onClick={() => onChange(ViewMode.CARD)}
        borderWidth="1px"
        bg={viewMode === ViewMode.CARD ? activeBg : "transparent"}
        borderColor={borderColor}
        _hover={{
          bg: hoverBg,
        }}
        px={3}
      >
        <Icon as={BsGrid} color={viewMode === ViewMode.CARD ? activeColor : iconColor} />
      </Button>
      <Button
        onClick={() => onChange(ViewMode.TABLE)}
        borderWidth="1px"
        bg={viewMode === ViewMode.TABLE ? activeBg : "transparent"}
        borderColor={borderColor}
        _hover={{
          bg: hoverBg,
        }}
        px={3}
      >
        <Icon as={BsTable} color={viewMode === ViewMode.TABLE ? activeColor : iconColor} />
      </Button>
    </ButtonGroup>
  );
};

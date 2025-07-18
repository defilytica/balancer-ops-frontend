"use client";
import { Box, Button, Skeleton, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { IoLayers } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { useComposer } from "./PayloadComposerContext";

interface ComposerIndicatorProps {
  onClick?: () => void;
}

const ComposerIndicator = ({ onClick }: ComposerIndicatorProps) => {
  const { operationCount, isMounted } = useComposer();
  const router = useRouter();

  const baseBorderColor = useColorModeValue("gray.500", "gray.500");
  const activeBorderColor = useColorModeValue("gray.400", "gray.400");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const hoverBorderColor = useColorModeValue("brown.100", "brown.300");
  const hoverColor = useColorModeValue("brown.700", "brown.200");
  const badgeBg = useColorModeValue("blue.500", "blue.400");
  const badgeColor = useColorModeValue("white", "white");

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push("/payload-builder/composer");
    }
  };

  const getTooltipText = () => {
    if (operationCount === 0) {
      return "No operations in composer";
    }
    return `${operationCount} operation${operationCount !== 1 ? "s" : ""} in composer`;
  };

  // Show skeleton during hydration to prevent mismatches
  if (!isMounted) {
    return (
      <Box position="relative">
        <Skeleton>
          <Button variant="outline" leftIcon={<IoLayers />} colorScheme="gray" size="md">
            Composer
          </Button>
        </Skeleton>
      </Box>
    );
  }

  return (
    <Tooltip label={getTooltipText()} hasArrow>
      <Box position="relative" width="full">
        <Button
          onClick={handleClick}
          variant="outline"
          leftIcon={<IoLayers />}
          colorScheme="gray"
          size="md"
          width="full"
          borderColor={operationCount > 0 ? activeBorderColor : baseBorderColor}
          boxShadow={operationCount > 0 ? `inset 0px 1px 2px rgba(0,0,0,0.08)` : "none"}
          _hover={{
            bg: hoverBg,
            borderColor: hoverBorderColor,
            color: hoverColor,
          }}
        >
          Composer
        </Button>
        {operationCount > 0 && (
          <Box
            position="absolute"
            top="-8px"
            right="-8px"
            bg={badgeBg}
            color={badgeColor}
            borderRadius="full"
            minW="22px"
            h="22px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="sm"
            fontWeight="bold"
            boxShadow="md"
            zIndex={1}
          >
            {operationCount}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

export default ComposerIndicator;

import React from "react";
import {
  Flex,
  Icon,
  Link as ChakraLink,
  FlexProps,
  useColorModeValue,
  Text,
  Box,
} from "@chakra-ui/react";
import { IconType } from "react-icons";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "react-feather";

interface NavItemProps extends FlexProps {
  icon: IconType;
  title?: string;
  children?: React.ReactNode;
  target: string;
  isCollapsed?: boolean;
  onClose?: () => void;
  hasSubItems?: boolean;
  isSubItem?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export interface NavItemType {
  name: string;
  icon: IconType;
  target?: string;
  description?: string;
  children?: NavItemType[];
}

const NavItem = ({
  icon,
  title,
  children,
  target = "/", // Provide default value
  isCollapsed,
  onClose,
  hasSubItems,
  isSubItem = false,
  isOpen = false,
  onToggle,
  ...rest
}: NavItemProps) => {
  const router = useRouter();
  const hoverBg = useColorModeValue("indigo.100", "indigo.900");
  const hoverColor = useColorModeValue("indigo.700", "indigo.200");
  const activeBg = useColorModeValue("indigo.200", "indigo.800");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasSubItems && onToggle) {
      onToggle();
    } else {
      if (onClose) onClose();
      router.push(target);
    }
  };

  return (
    <ChakraLink
      as={NextLink}
      href={target} // This is now guaranteed to have a value
      style={{ textDecoration: "none" }}
      _focus={{ boxShadow: "none" }}
      onClick={handleClick}
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        pl={isSubItem ? 8 : 4}
        _hover={{
          bg: hoverBg,
          color: hoverColor,
        }}
        _active={{
          bg: activeBg,
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: hoverColor,
            }}
            as={icon}
          />
        )}
        {!isCollapsed && (
          <>
            <Text>{title || children}</Text>
            {hasSubItems && (
              <Box
                ml="auto"
                transform={isOpen ? "rotate(90deg)" : "none"}
                transition="transform 0.2s"
              >
                <ChevronRight size={16} />
              </Box>
            )}
          </>
        )}
      </Flex>
    </ChakraLink>
  );
};

export default NavItem;

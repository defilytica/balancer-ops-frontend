'use client'
import React, {useEffect, useState} from 'react'
import {
    Flex,
    Link,
    Menu,
    MenuList,
    MenuButton,
    Icon,
    Text,
    FlexProps
} from '@chakra-ui/react'
import { IconType } from 'react-icons'
import NavHoverBox from './NavHoverBox'
import {colors} from "@/lib/shared/services/chakra/themes/base/colors";

interface NavItemProps extends FlexProps {
    icon: IconType;
    title: string;
    description: string;
    target: string;
    active?: boolean;
    navSize: "small" | "large";
}

export default function NavItem({ icon, title, description, target, active, navSize }: NavItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showText, setShowText] = useState(navSize === "large");

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (navSize === "large") {
            timeout = setTimeout(() => setShowText(true), 0.3 * 1000);
        } else {
            setShowText(false);
        }
        return () => clearTimeout(timeout);
    }, [navSize]);

    return (
        <Flex
            mt={30}
            flexDir="column"
            w="100%"
            alignItems={navSize == "small" ? "center" : "flex-start"}
            transition="all 0.3s ease"
        >
            <Menu isOpen={isOpen} placement="right">
                <Link
                    backgroundColor={active ? colors.brown[300] : undefined}
                    p={3}
                    borderRadius={8}
                    href={target}
                    _hover={{ textDecor: 'none', backgroundColor: "secondary" }}
                    w={navSize == "large" ? "100%" : undefined}
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <MenuButton w="100%">
                        <Flex>
                            <Icon as={icon} fontSize="xl" color={active ? colors.brown[300] : colors.brown[300]} />
                            <Text
                                ml={5}
                                opacity={showText ? 1 : 0}
                                display={navSize == "small" ? "none" : "flex"}
                                transition="all 0.3s ease"
                            >
                                {title}
                            </Text>
                        </Flex>
                    </MenuButton>
                </Link>
                <MenuList
                    py={0}
                    border="none"
                    w={200}
                    h={200}
                    ml={5}
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <NavHoverBox title={title} icon={icon} description={description} />
                </MenuList>
            </Menu>
        </Flex>
    )
}

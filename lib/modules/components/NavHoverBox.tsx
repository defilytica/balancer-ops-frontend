import React from 'react'
import {
    Flex,
    Heading,
    Text,
    Icon,
    FlexProps,
    useColorModeValue
} from '@chakra-ui/react'
import { IconType } from 'react-icons'
import { colors } from "@/lib/shared/services/chakra/themes/base/colors";

interface NavHoverBoxProps extends FlexProps {
    title: string;
    icon: IconType;
    description: string;
}

export default function NavHoverBox({ title, icon, description }: NavHoverBoxProps) {
    const bgColor = useColorModeValue(colors.gray[100], colors.gray[600]);
    const textColor = useColorModeValue(colors.gray[600], colors.gray[100]);
    const iconColor = useColorModeValue(colors.brown[500], colors.brown[300]);

    return (
        <Flex
            p={3}
            flexDir="column"
            alignItems="center"
            justify="center"
            backgroundColor={bgColor}
            borderRadius="8px"
            color={textColor}
            textAlign="center"
            boxShadow="sm"
        >
            <Icon as={icon} color={iconColor} fontSize="xl" mb={2} />
            <Heading size="sm" fontWeight="medium" mb={1}>{title}</Heading>
            <Text fontSize="xs">{description}</Text>
        </Flex>
    )
}

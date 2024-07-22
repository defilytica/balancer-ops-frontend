import React from 'react'
import {
    Flex,
    Heading,
    Text,
    Icon,
    FlexProps
} from '@chakra-ui/react'
import { IconType } from 'react-icons'
import {colors} from "@/lib/shared/services/chakra/themes/base/colors";

interface NavHoverBoxProps extends FlexProps {
    title: string;
    icon: IconType;
    description: string;
}

export default function NavHoverBox({ title, icon, description }: NavHoverBoxProps) {
    return (
        <>
            <Flex
                pos="absolute"
                mt="calc(100px - 7.5px)"
                ml="-10px"
                width={0}
                height={0}
                borderTop="10px solid transparent"
                borderBottom="10px solid transparent"
                borderRight="10px solid #82AAAD"
            />
            <Flex
                h={200}
                p={4}
                w="100%"
                flexDir="column"
                alignItems="center"
                justify="center"
                backgroundColor={colors.gray[500]}
                borderRadius="10px"
                color="#fff"
                textAlign="center"
            >
                <Icon as={icon} fontSize="3xl" mb={4} />
                <Heading size="md" fontWeight="normal">{title}</Heading>
                <Text>{description}</Text>
            </Flex>
        </>
    )
}

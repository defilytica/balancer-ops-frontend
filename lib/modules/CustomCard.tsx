'use client';

import {
    Card as ChakraCard,
    CardHeader,
    CardBody,
    CardFooter,
    Flex,
    Heading,
    Text,
    Avatar,
    Button,
    useColorModeValue
} from '@chakra-ui/react';
import Link from 'next/link';
import { ReactElement } from 'react';

interface CardProps {
    title: string;
    description: string;
    button_label: string,
    icon: ReactElement;
    link: string;
}

export default function CustomCard({ title, description, button_label, icon, link }: CardProps) {
    return (
        <ChakraCard align='center' boxShadow='md' borderRadius='md'>
            <CardHeader>
                <Flex align='center' justify='flex-start' w='full'>
                    <Flex
                        w={12}
                        h={12}
                        align={'center'}
                        justify={'center'}
                        color={'white'}
                        rounded={'full'}
                        bg={useColorModeValue('gray.400', 'blue.700')}
                        flexShrink={0}>
                        {icon}
                    </Flex>
                    <Heading size='md' ml={4}>{title}</Heading>
                </Flex>
            </CardHeader>
            <CardBody>
                <Text>{description}</Text>
            </CardBody>
            <CardFooter>
                <Link href={link} legacyBehavior>
                    <Button  rightIcon={icon}>
                        {button_label}
                    </Button>
                </Link>
            </CardFooter>
        </ChakraCard>
    );
}

// lib/modules/Card.tsx
'use client';

import { Card as ChakraCard, CardHeader, CardBody, CardFooter, Flex, Heading, Text, Avatar, Button } from '@chakra-ui/react';
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
                <Flex align='center'>
                    <Heading size='md'>{title}</Heading>
                </Flex>
            </CardHeader>
            <CardBody>
                <Text>{description}</Text>
            </CardBody>
            <CardFooter>
                <Link href={link} legacyBehavior>
                    <Button colorScheme='teal' rightIcon={icon}>
                        {button_label}
                    </Button>
                </Link>
            </CardFooter>
        </ChakraCard>
    );
}

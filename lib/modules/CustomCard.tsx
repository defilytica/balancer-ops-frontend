// lib/modules/Card.tsx
'use client';

import { Card as ChakraCard, CardHeader, CardBody, CardFooter, Flex, Heading, Text, Avatar, Button } from '@chakra-ui/react';
import Link from 'next/link';
import { ReactElement } from 'react';

interface CardProps {
    title: string;
    description: string;
    icon: ReactElement;
    link: string;
}

export default function CustomCard({ title, description, icon, link }: CardProps) {
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
                        {title}
                    </Button>
                </Link>
            </CardFooter>
        </ChakraCard>
    );
}

"use client";

import {
  Card as ChakraCard,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
  Heading,
  Text,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import Link from "next/link";
import { ReactElement } from "react";
import { colors } from "@/lib/services/chakra/themes/base/colors";

interface CardProps {
  title: string;
  description: string;
  button_label: string;
  icon: ReactElement;
  link: string;
}

export default function CustomCard({ title, description, button_label, icon, link }: CardProps) {
  return (
    <ChakraCard align="center" boxShadow="md" borderRadius="md">
      <CardHeader>
        <Flex align="center" justify="flex-start" w="full">
          <Flex
            w={12}
            h={12}
            align={"center"}
            justify={"center"}
            color={"white"}
            rounded={"full"}
            bg={useColorModeValue(colors.brown[200], colors.brown[300])}
            flexShrink={0}
          >
            {icon}
          </Flex>
          <Heading as="h2" size="md" ml={4} variant="secondary">
            {title}
          </Heading>
        </Flex>
      </CardHeader>
      <CardBody>
        <Text>{description}</Text>
      </CardBody>
      <CardFooter>
        <Button as={Link} href={link} variant="secondary" rightIcon={icon}>
          {button_label}
        </Button>
      </CardFooter>
    </ChakraCard>
  );
}

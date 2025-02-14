import React, { useState, useEffect } from 'react';
import { MdDesktopMac } from 'react-icons/md';
import {
  Box,
  VStack,
  Heading,
  Text,
  Container,
  Icon,
  useColorModeValue,
  Flex,
  Card,
  CardBody
} from '@chakra-ui/react';

const MobileWarning = ({ children }: { children: React.ReactNode }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  if (!isMobile) {
    return children;
  }

  return (
    <Flex
      minH="50vh"
      align="center"
      justify="center"
    >
      <Container maxW="md">
        <Card
          variant="elevated"
          bg={useColorModeValue('white', 'gray.800')}
          boxShadow="xl"
          borderRadius="xl"
        >
          <CardBody>
            <VStack spacing={6} align="center" p={4}>
              <Box
                
                p={4}
                borderRadius="full"
              >
                <Icon
                  as={MdDesktopMac}
                  w={12}
                  h={12}
                  color={useColorModeValue('white', 'white')}
                />
              </Box>
              
              <Heading
                size="lg"
                fontWeight="bold"
                textAlign="center"
                color={useColorModeValue('gray.900', 'white')}
              >
                Desktop Only Feature
              </Heading>

              <Text
                fontSize="md"
                textAlign="center"
                color={useColorModeValue('gray.600', 'gray.300')}
              >
                The Balancer v2 Pool Creator is only available on desktop devices due to its complex interface and functionality.
              </Text>

              <Text
                fontSize="sm"
                textAlign="center"
                color={useColorModeValue('gray.500', 'gray.400')}
              >
                Please visit this page on a desktop computer to access the pool creation tools.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Flex>
  );
};

export default MobileWarning;
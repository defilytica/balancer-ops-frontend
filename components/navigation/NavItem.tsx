import React from 'react'
import {
    Flex,
    Icon,
    Link as ChakraLink,
    FlexProps,
    useColorModeValue,
} from '@chakra-ui/react'
import { IconType } from 'react-icons'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'

interface NavItemProps extends FlexProps {
    icon: IconType
    children: React.ReactNode
    target: string
    onClose: () => void  // Add this line
}

const NavItem = ({ icon, children, target, onClose, ...rest }: NavItemProps) => {
    const router = useRouter()
    const hoverBg = useColorModeValue('indigo.100', 'indigo.900')
    const hoverColor = useColorModeValue('indigo.700', 'indigo.200')
    const activeBg = useColorModeValue('indigo.200', 'indigo.800')

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        onClose()  // Close the drawer
        router.push(target)  // Navigate to the target
    }

    return (
        <ChakraLink
            as={NextLink}
            href={target}
            style={{ textDecoration: 'none' }}
            _focus={{ boxShadow: 'none' }}
            onClick={handleClick}  // Add onClick handler
        >
            <Flex
                align="center"
                p="4"
                mx="4"
                borderRadius="lg"
                role="group"
                cursor="pointer"
                _hover={{
                    bg: hoverBg,
                    color: hoverColor,
                }}
                _active={{
                    bg: activeBg,
                }}
                {...rest}>
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
                {children}
            </Flex>
        </ChakraLink>
    )
}

export default NavItem
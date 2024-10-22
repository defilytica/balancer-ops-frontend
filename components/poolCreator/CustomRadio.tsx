import { Box, useRadio, UseRadioProps } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface CustomRadioProps extends UseRadioProps {
    children: ReactNode;
}

export const CustomRadio = (props: CustomRadioProps) => {
    const { getInputProps, getRadioProps } = useRadio(props)
    const input = getInputProps()
    const checkbox = getRadioProps()

    return (
        <Box as='label'>
            <input {...input} />
            <Box
                {...checkbox}
                cursor='pointer'
                borderWidth='1px'
                borderRadius='md'
                boxShadow='md'
                _checked={{
                    bg: 'blue.50',
                    color: 'blue.900',
                    borderColor: 'blue.500',
                }}
                _focus={{
                    boxShadow: 'outline',
                }}
                px={5}
                py={3}
            >
                {props.children}
            </Box>
        </Box>
    )
}

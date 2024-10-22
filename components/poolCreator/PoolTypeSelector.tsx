import { Box, Button, Stack, Text, useRadioGroup } from '@chakra-ui/react';
import { CustomRadio } from './CustomRadio';
import {PoolType} from "@/types/types";

export const PoolTypeSelector = ({ onSelect }: { onSelect: (type: PoolType) => void }) => {
    const options = [
        { value: 'weighted', label: 'Weighted Pool', description: 'Flexible weight distribution between tokens' },
        { value: 'composableStable', label: 'Composable Stable Pool', description: 'For tokens that maintain similar values' }
    ];

    const { getRootProps, getRadioProps } = useRadioGroup({
        onChange: (value) => onSelect(value as PoolType)
    });

    return (
        <Stack {...getRootProps()}>
            {options.map(({ value, label, description }) => (
                <CustomRadio key={value} {...getRadioProps({ value })}>
                    <Text fontWeight="bold">{label}</Text>
                    <Text fontSize="sm" color="gray.600">{description}</Text>
                </CustomRadio>
            ))}
        </Stack>
    );
};

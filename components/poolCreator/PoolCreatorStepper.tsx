import { Box, Step, StepDescription, StepIcon, StepIndicator, StepNumber, StepSeparator, StepStatus, StepTitle, Stepper, useSteps } from '@chakra-ui/react';

const steps = [
    { title: 'Pool Type', description: 'Select pool type' },
    { title: 'Tokens', description: 'Configure tokens' },
    { title: 'Settings', description: 'Additional settings' },
    { title: 'Review', description: 'Confirm configuration' }
];

export const PoolCreatorStepper = ({ activeStep }: { activeStep: number }) => {
    return (
        <Stepper index={activeStep}>
            {steps.map((step, index) => (
                <Step key={index}>
                    <StepIndicator>
                        <StepStatus
                            complete={<StepIcon />}
                            incomplete={<StepNumber />}
                            active={<StepNumber />}
                        />
                    </StepIndicator>
                    <Box flexShrink='0'>
                        <StepTitle>{step.title}</StepTitle>
                        <StepDescription>{step.description}</StepDescription>
                    </Box>
                    <StepSeparator />
                </Step>
            ))}
        </Stepper>
    );
};

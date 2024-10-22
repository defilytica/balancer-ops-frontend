import { Button, ButtonGroup, Flex } from '@chakra-ui/react'

interface StepNavigationProps {
    activeStep: number;
    isNextDisabled?: boolean;
    onNext: () => void;
    onBack: () => void;
    onFinish?: () => void;
    isLastStep?: boolean;
}

export const StepNavigation = ({
                                   activeStep,
                                   isNextDisabled = false,
                                   onNext,
                                   onBack,
                                   onFinish,
                                   isLastStep = false,
                               }: StepNavigationProps) => {
    return (
        <Flex justifyContent="space-between" mt={6}>
            <Button
                variant="ghost"
                onClick={onBack}
                isDisabled={activeStep === 0}
            >
                Back
            </Button>
            <ButtonGroup>
                {isLastStep ? (
                    <Button
                        colorScheme="green"
                        onClick={onFinish}
                        isDisabled={isNextDisabled}
                    >
                        Create Pool
                    </Button>
                ) : (
                    <Button
                        colorScheme="blue"
                        onClick={onNext}
                        isDisabled={isNextDisabled}
                    >
                        Next Step
                    </Button>
                )}
            </ButtonGroup>
        </Flex>
    )
}

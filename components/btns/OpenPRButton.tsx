import React from "react";
import { useSession } from "next-auth/react";
import { Button, Tooltip } from "@chakra-ui/react";
import { VscGithubInverted } from "react-icons/vsc";

interface OpenPRButtonProps {
  onClick: () => void;
  network?: string;
}

const OpenPRButton = ({ onClick, network }: OpenPRButtonProps) => {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isSonic = network?.toLowerCase() === "sonic";

  // Determine if button should be disabled
  const isDisabled = !isAuthenticated || isSonic;

  // Determine tooltip message
  let tooltipMessage = "You need to log in to Github on the top menu to be able to open a PR";
  if (isSonic) {
    tooltipMessage = "PRs are not supported for the Sonic network";
  } else if (!isAuthenticated) {
    tooltipMessage = "You need to log in to Github on the top menu to be able to open a PR";
  }

  return (
    <Tooltip
      label={tooltipMessage}
      isDisabled={isAuthenticated && !isSonic}
      hasArrow
    >
      <Button
        leftIcon={<VscGithubInverted />}
        onClick={onClick}
        isDisabled={isDisabled}
        variant="secondary"
        opacity={isDisabled ? 0.5 : 1}
        cursor={isDisabled ? "not-allowed" : "pointer"}
      >
        Open PR
      </Button>
    </Tooltip>
  );
};

export default OpenPRButton;

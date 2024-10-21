import React from "react";
import { useSession } from "next-auth/react";
import { Button, Tooltip } from "@chakra-ui/react";
import { VscGithubInverted } from "react-icons/vsc";

const OpenPRButton = ({ onClick }: { onClick: () => void }) => {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <Tooltip
      label="You need to log in to open a PR"
      isDisabled={isAuthenticated}
      hasArrow
    >
      <Button
        leftIcon={<VscGithubInverted />}
        onClick={onClick}
        isDisabled={!isAuthenticated}
        variant="secondary"
        opacity={isAuthenticated ? 1 : 0.5}
        cursor={isAuthenticated ? "pointer" : "not-allowed"}
      >
        Open PR
      </Button>
    </Tooltip>
  );
};

export default OpenPRButton;

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@chakra-ui/react";

export function SignInButton() {
  const session = useSession();

  if (!session.data?.user) {
    return (
      <Button
        size={"xs"}
        rounded={"full"}
        variant={"primary"}
        onClick={() => signIn("github")}
      >
        Sign In
      </Button>
    );
  }
  return (
    <Button
      size={"xs"}
      rounded={"full"}
      variant={"primary"}
      onClick={() => signOut()}
    >
      Sign Out
    </Button>
  );
}

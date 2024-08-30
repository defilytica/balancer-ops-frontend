import { UseToastOptions } from "@chakra-ui/react";

interface CreatePRParams {
  repo: string;
  payload: any;
  branchName: string;
  title: string;
  description: string;
  toast: (options: UseToastOptions) => void;
}

export const createPR = async ({
  repo,
  payload,
  branchName,
  title,
  description,
  toast,
}: CreatePRParams): Promise<void> => {
  const currentDate = new Date().toISOString().split("T")[0];
  const filePath = `payloads/${currentDate}-enable-gauge.json`;
  const base = "main";

  try {
    const response = await fetch("/api/github/pr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repo,
        payload,
        filePath,
        branchName,
        title,
        description,
        base,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    toast({
      title: "PR created successfully",
      description: `PR URL: ${data.pr_url}`,
      status: "success",
      duration: 9000,
      isClosable: true,
    });

    window.open(data.pr_url, "_blank");
  } catch (error: any) {
    console.error("Error creating PR:", error);
    toast({
      title: "Error creating PR",
      description: error.message,
      status: "error",
      duration: 9000,
      isClosable: true,
    });
  }
};

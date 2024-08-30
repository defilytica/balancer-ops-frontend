import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { payload, filePath, branchName, title, description, base, repo } =
    body;

  if (!payload || !filePath || !branchName || !title || !base || !repo) {
    return NextResponse.json(
      {
        message:
          "Payload, file path, branch name, title, base, and repo are required",
      },
      { status: 400 },
    );
  }

  // Split the repo string into owner and repo name
  const [owner, repoName] = repo.split("/");

  if (!owner || !repoName) {
    return NextResponse.json(
      { message: 'Invalid repository format. Expected "owner/repo"' },
      { status: 400 },
    );
  }

  try {
    // Fetch the user's GitHub access token from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          where: { provider: "github" },
          select: { access_token: true },
        },
      },
    });

    if (!user || !user.accounts[0]?.access_token) {
      return NextResponse.json(
        { message: "GitHub account not linked or access token not found" },
        { status: 400 },
      );
    }

    const githubToken = user.accounts[0].access_token;

    const octokit = new Octokit({ auth: githubToken });

    // Step 1: Get the latest commit SHA of the base branch
    const { data: baseBranchData } = await octokit.repos.getBranch({
      owner,
      repo: repoName,
      branch: base,
    });
    const baseSha = baseBranchData.commit.sha;

    // Step 2: Create a new branch
    await octokit.git.createRef({
      owner,
      repo: repoName,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Step 3: Create or update the file in the new branch
    const content = Buffer.from(JSON.stringify(payload)).toString("base64");
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: filePath,
      message: "chore: add payload file",
      content,
      branch: branchName,
    });

    // Step 4: Create a pull request
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo: repoName,
      title: title,
      body: description,
      head: branchName,
      base: base,
    });

    return NextResponse.json({ pr_url: pr.html_url }, { status: 200 });
  } catch (error) {
    console.error(error);
    const err = error as Error;
    return NextResponse.json(
      { message: "Internal Server Error", error: err.message },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

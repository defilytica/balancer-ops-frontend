import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { decrypt } from "@/lib/config/encrypt";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Get the repo parameter from the URL
  const url = new URL(req.url);
  const repo = url.searchParams.get("repo");

  if (!repo) {
    return NextResponse.json({ message: "Repository parameter is required" }, { status: 400 });
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

    const githubTokenEncrypted = user.accounts[0].access_token;
    const githubToken = decrypt(githubTokenEncrypted);

    const octokit = new Octokit({ auth: githubToken });

    // Get authenticated user
    const { data: authUser } = await octokit.users.getAuthenticated();

    // Check if fork exists
    let fork;
    try {
      const { data: existingFork } = await octokit.repos.get({
        owner: authUser.login,
        repo: repoName,
      });
      fork = existingFork;
    } catch (error) {
      // If fork doesn't exist, return early
      return NextResponse.json(
        {
          isOutdated: false,
          hasFork: false,
          message: "Fork does not exist",
        },
        { status: 200 },
      );
    }

    // Get the default branch of the original repo
    const { data: parentRepo } = await octokit.repos.get({
      owner,
      repo: repoName,
    });
    const defaultBranch = parentRepo.default_branch;

    // Compare the fork with the original repo using compareCommitsWithBasehead
    // Format: BASE...HEAD where BASE is the fork and HEAD is the original repo
    const compareString = `${authUser.login}:${defaultBranch}...${owner}:${defaultBranch}`;

    const { data: comparison } = await octokit.repos.compareCommitsWithBasehead({
      owner,
      repo: repoName,
      basehead: compareString,
    });

    // Calculate how many commits behind the fork is
    const behindBy = comparison.ahead_by; // We use ahead_by because we're comparing fork->original
    const isOutdated = behindBy > 0;

    return NextResponse.json(
      {
        forkRepo: fork.full_name,
        isOutdated,
        behindBy,
        hasFork: true,
        defaultBranch,
        message: isOutdated
          ? `Fork is ${behindBy} commits behind the original repository`
          : "Fork is up to date",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error details:", error);
    const err = error as Error;
    return NextResponse.json(
      { message: "Internal Server Error", error: err.message },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

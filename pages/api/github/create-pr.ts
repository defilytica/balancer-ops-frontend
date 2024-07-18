import type { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from '@octokit/rest';

const createPRHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { payload, filePath, branchName, title, base } = req.body;

    // Log the received data for debugging
    console.log('Received data:', { payload, filePath, branchName, title, base });

    if (!payload || !filePath || !branchName || !title || !base) {
        return res.status(400).json({ message: 'Payload, file path, branch name, title, and base are required' });
    }

    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
    });

    try {
        // Step 1: Get the latest commit SHA of the base branch (e.g., main)
        const { data: baseBranchData } = await octokit.repos.getBranch({
            owner: 'defilytica',
            repo: 'multisig-ops-mock',
            branch: base,
        });
        const baseSha = baseBranchData.commit.sha;

        // Step 2: Create a new branch from the latest commit of the base branch
        await octokit.git.createRef({
            owner: 'defilytica',
            repo: 'multisig-ops-mock',
            ref: `refs/heads/${branchName}`,
            sha: baseSha,
        });

        // Step 3: Create or update the file in the new branch
        const content = Buffer.from(JSON.stringify(payload)).toString('base64');
        await octokit.repos.createOrUpdateFileContents({
            owner: 'defilytica',
            repo: 'multisig-ops-mock',
            path: filePath,
            message: 'chore: add payload file',
            content,
            branch: branchName,
        });

        // Step 4: Create a pull request
        const { data: pr } = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
            owner: 'defilytica',
            repo: 'multisig-ops-mock',
            title: title,
            body: 'Please pull these awesome changes in!',
            head: branchName,
            base: base,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        res.status(200).json({ pr_url: pr.html_url });
    } catch (error) {
        console.error(error);

        // Type assertion for error
        const err = error as Error;

        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

export default createPRHandler;

const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");
const fs = require("fs");

// Create an authenticated Octokit instance for a specific installation
function getOctokit(installationId) {
  const privateKey = fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH, "utf8");

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey,
      installationId,
    },
  });
}

// Fetch all changed files and their diffs for a pull request
async function getPRDiff({ owner, repo, pullNumber, installationId }) {
  const octokit = getOctokit(installationId);

  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });

  // Build a readable diff string: filename + patch (the actual code changes)
  const diff = files
    .filter((f) => f.patch) // skip binary files
    .map((f) => `### File: ${f.filename}\n${f.patch}`)
    .join("\n\n");

  return diff;
}

// Post the AI's review comments as an inline GitHub Pull Request Review
async function postReviewComments({
  owner,
  repo,
  pullNumber,
  commitSha,
  comments,
  installationId,
}) {
  const octokit = getOctokit(installationId);

  // Format comments for GitHub's Review API
  const reviewComments = comments.map((c) => ({
    path: c.file,       // which file
    line: c.line,       // which line number
    body: `🤖 **AI Review**\n\n**Issue:** ${c.issue}\n\n**Suggestion:** ${c.suggestion}`,
    side: "RIGHT",      // RIGHT = new version of the file
  }));

  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    commit_id: commitSha,
    event: "COMMENT",   // post comments without approving/rejecting
    comments: reviewComments,
  });
}

module.exports = { getPRDiff, postReviewComments };

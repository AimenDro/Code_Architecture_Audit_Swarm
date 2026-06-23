const crypto = require("crypto");
const { getPRDiff, postReviewComments } = require("./github");
const { getAIReview } = require("./openai");

// Verify the request genuinely came from GitHub using HMAC signature
function verifySignature(req) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET);
  hmac.update(req.rawBody);
  const digest = "sha256=" + hmac.digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

async function handleWebhook(req, res) {
  // 1. Verify signature — reject anything that doesn't come from GitHub
  if (!verifySignature(req)) {
    console.warn("Invalid webhook signature — request rejected");
    return res.status(401).send("Unauthorized");
  }

  const event = req.headers["x-github-event"];
  const payload = req.body;

  // 2. Only act on pull_request events that are opened or updated
  if (
    event !== "pull_request" ||
    !["opened", "synchronize"].includes(payload.action)
  ) {
    return res.status(200).send("Event ignored");
  }

  const { number, base, head } = payload.pull_request;
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const installationId = payload.installation.id;

  console.log(`PR #${number} ${payload.action} in ${owner}/${repo}`);

  // 3. Respond immediately so GitHub doesn't time out (must reply within 10s)
  res.status(200).send("Review in progress");

  try {
    // 4. Fetch the changed files and their diffs
    const diff = await getPRDiff({ owner, repo, pullNumber: number, installationId });

    if (!diff || diff.trim() === "") {
      console.log("No diff found — skipping review");
      return;
    }

    // 5. Send the diff to OpenAI and get structured review comments
    const comments = await getAIReview(diff);

    if (!comments || comments.length === 0) {
      console.log("No issues found by AI — PR looks good!");
      return;
    }

    // 6. Post each comment inline on the PR
    await postReviewComments({
      owner,
      repo,
      pullNumber: number,
      commitSha: head.sha,
      comments,
      installationId,
    });

    console.log(`Posted ${comments.length} review comments on PR #${number}`);
  } catch (err) {
    console.error("Error during review:", err.message);
  }
}

module.exports = { handleWebhook };

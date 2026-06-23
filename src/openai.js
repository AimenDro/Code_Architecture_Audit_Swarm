const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert senior software engineer performing a pull request code review.

Analyze the provided code diff and identify real issues only. Focus on:
- Bugs or logic errors
- Security vulnerabilities (SQL injection, XSS, hardcoded secrets, etc.)
- Performance problems
- Bad practices (missing error handling, deeply nested code, etc.)
- Code style issues only if they are significant

Return ONLY a valid JSON array. No explanation, no markdown, no extra text.
Each item in the array must have exactly these fields:
- "file": the filename (e.g. "src/index.js")
- "line": the line number as an integer (must be a changed line from the diff)
- "issue": a short description of the problem (one sentence)
- "suggestion": a concrete fix or improvement (one or two sentences)

If you find no real issues, return an empty array: []`;

async function getAIReview(diff) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2, // low temperature = consistent, focused output
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Review this pull request diff:\n\n${diff}`,
      },
    ],
  });

  const raw = response.choices[0].message.content.trim();

  // Safely parse the JSON — GPT occasionally wraps it in backticks
  const cleaned = raw.replace(/```json|```/g, "").trim();

  let comments;
  try {
    comments = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI response as JSON:", cleaned);
    return [];
  }

  // Validate shape before returning
  return comments.filter(
    (c) =>
      typeof c.file === "string" &&
      typeof c.line === "number" &&
      typeof c.issue === "string" &&
      typeof c.suggestion === "string"
  );
}

module.exports = { getAIReview };

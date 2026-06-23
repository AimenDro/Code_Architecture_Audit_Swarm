# 🤖 AI Code Reviewer — GitHub Bot

A GitHub App that automatically reviews Pull Requests using GPT-4o. When a developer opens or updates a PR, the bot fetches the diff, sends it to OpenAI, and posts inline review comments pointing out bugs, security issues, and bad practices — just like a senior engineer would.

---

## ✨ Features

- Automatically triggers on every new or updated Pull Request
- Posts **inline comments** on exact lines with issues found
- Detects bugs, security vulnerabilities, performance problems, and bad practices
- Verifies GitHub webhook signatures for security
- Easy to install on any repository

---

## 🛠 Tech Stack

- **Node.js** + **Express** — webhook server
- **Octokit** — GitHub API client
- **OpenAI GPT-4o** — AI code review engine
- **@octokit/auth-app** — GitHub App JWT authentication

---

## 🚀 How It Works

```
Dev opens PR → GitHub fires webhook → Server receives event
→ Fetch PR diff via GitHub API → Send diff to GPT-4o
→ Parse structured comments → Post inline review on PR
```

---

## ⚙️ Setup & Installation

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/ai-code-reviewer.git
cd ai-code-reviewer
npm install
```

### 2. Register a GitHub App
- Go to GitHub → Settings → Developer Settings → GitHub Apps → New GitHub App
- Set the webhook URL to your deployed server URL + `/webhook`
- Permissions needed: **Pull requests** (Read & Write), **Contents** (Read)
- Subscribe to event: **Pull request**
- Download the private key and save as `private-key.pem` in the project root

### 3. Configure environment variables
```bash
cp .env.example .env
```
Fill in your `.env`:
```
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY_PATH=private-key.pem
GITHUB_WEBHOOK_SECRET=your_webhook_secret
OPENAI_API_KEY=your_openai_key
PORT=3000
```

### 4. Run locally (with ngrok for testing)
```bash
# Terminal 1
node src/index.js

# Terminal 2 — expose local server to GitHub
ngrok http 3000
```
Use the ngrok URL as your GitHub App webhook URL.

### 5. Deploy to production
Deploy to [Railway](https://railway.app) or [Render](https://render.com) (both free tier available), set your environment variables in the dashboard, and update your GitHub App webhook URL.

---

## 📸 Example Review

When a PR is opened, the bot posts comments like this:

> 🤖 **AI Review**
>
> **Issue:** Hardcoded API key exposed in source code.
>
> **Suggestion:** Move the key to an environment variable and access it via `process.env.API_KEY`.

---

## 📄 License

MIT

require("dotenv").config();
const express = require("express");
const { handleWebhook } = require("./webhook");

const app = express();
const PORT = process.env.PORT || 3000;

// Parse raw body for webhook signature verification
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Main webhook endpoint — GitHub will POST here on every PR event
app.post("/webhook", handleWebhook);

// Health check — useful to confirm server is running after deploy
app.get("/", (_req, res) => res.send("AI Code Reviewer is running ✅"));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

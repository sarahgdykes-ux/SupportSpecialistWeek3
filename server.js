const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3000;
const rootDir = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

// A lightweight fallback classifier keeps the app usable even without an API key.
function getFallbackAnalysis(ticketText) {
  const text = ticketText.toLowerCase();

  let issueType = "Other";
  let priority = "Medium";
  let suggestedTeam = "Support";

  if (text.includes("login") || text.includes("authenticate") || text.includes("auth")) {
    issueType = "Login Issue";
    suggestedTeam = "Engineering";
  } else if (text.includes("password") || text.includes("reset")) {
    issueType = "Password Reset";
    suggestedTeam = "Support";
  } else if (text.includes("bill") || text.includes("invoice") || text.includes("charge")) {
    issueType = "Billing";
    suggestedTeam = "Billing";
  } else if (text.includes("feature") || text.includes("request")) {
    issueType = "Feature Request";
    suggestedTeam = "Product";
  } else if (text.includes("bug") || text.includes("error") || text.includes("crash")) {
    issueType = "Bug Report";
    suggestedTeam = "Engineering";
  } else if (text.includes("slow") || text.includes("performance") || text.includes("latency")) {
    issueType = "Performance";
    suggestedTeam = "Infrastructure";
  } else if (text.includes("account") || text.includes("user") || text.includes("permission")) {
    issueType = "Account Management";
    suggestedTeam = "Support";
  }

  if (
    text.includes("critical") ||
    text.includes("outage") ||
    text.includes("cannot") ||
    text.includes("down") ||
    text.includes("all users") ||
    (text.includes("employees") && text.includes("log in")) ||
    text.includes("authentication error")
  ) {
    priority = "Critical";
  } else if (text.includes("urgent") || text.includes("blocked") || text.includes("high impact")) {
    priority = "High";
  } else if (text.includes("slow") || text.includes("minor")) {
    priority = "Low";
  }

  const explanation = `The ticket appears to match ${issueType.toLowerCase()} patterns and ${priority.toLowerCase()} urgency, so it is routed to ${suggestedTeam}.`;

  return {
    issueType,
    priority,
    suggestedTeam,
    explanation,
    source: "fallback",
  };
}

// Call the OpenAI chat completions API when an API key is provided.
async function analyzeWithOpenAI(ticketText, apiKey) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a support triage assistant. Return strict JSON with issueType, priority, suggestedTeam, explanation. Use the categories: Login Issue, Password Reset, Billing, Bug Report, Feature Request, Performance, Account Management, Other; priorities: Low, Medium, High, Critical; teams: Support, Engineering, Billing, Infrastructure, Product.",
        },
        {
          role: "user",
          content: `Classify this support ticket:\n${ticketText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "OpenAI request failed.");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : {};
  }

  return {
    issueType: parsed.issueType || "Other",
    priority: parsed.priority || "Medium",
    suggestedTeam: parsed.suggestedTeam || "Support",
    explanation: parsed.explanation || "The model did not provide an explanation.",
    source: "openai",
  };
}

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (error, fileContent) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const extension = path.extname(filePath);
    const contentType = mimeTypes[extension] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(fileContent);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/analyze") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}") || {};
        const apiKey = payload.apiKey || process.env.OPENAI_API_KEY;
        const ticketList = Array.isArray(payload.tickets)
          ? payload.tickets.filter((ticket) => typeof ticket === "string" && ticket.trim())
          : [];
        const ticketText = payload.ticketText || "";
        const tickets = ticketList.length ? ticketList : (ticketText ? [ticketText] : []);

        if (!tickets.length) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: "At least one ticket is required." }));
          return;
        }

        const results = [];

        for (const ticket of tickets) {
          try {
            const result = apiKey
              ? await analyzeWithOpenAI(ticket, apiKey)
              : getFallbackAnalysis(ticket);

            results.push({
              ticket,
              ...result,
            });
          } catch (error) {
            res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ error: "The AI service could not analyze the ticket right now. Please try again in a moment." }));
            return;
          }
        }

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(results));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });

    return;
  }

  let requestPath = req.url === "/" ? "/index.html" : req.url;
  requestPath = requestPath.split("?")[0];
  const safePath = path.normalize(requestPath).replace(/^\.\.(?:\/|\\)/, "");
  const filePath = path.join(rootDir, safePath);

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  serveStaticFile(res, filePath);
});

server.listen(port, () => {
  console.log(`Support triage app is running at http://localhost:${port}`);
});

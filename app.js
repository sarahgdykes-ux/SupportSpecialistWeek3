// Keep the category lists close to the UI so they are easy to update later.
const issueTypeOptions = [
  "Login Issue",
  "Password Reset",
  "Billing",
  "Bug Report",
  "Feature Request",
  "Performance",
  "Account Management",
  "Other",
];

const priorityOptions = ["Low", "Medium", "High", "Critical"];
const teamOptions = ["Support", "Engineering", "Billing", "Infrastructure", "Product"];

const ui = {
  ticketInput: document.getElementById("ticket-input"),
  ticketCountValue: document.getElementById("ticket-count-value"),
  apiKeyInput: document.getElementById("api-key"),
  analyzeButton: document.getElementById("analyze-btn"),
  tryExampleButton: document.getElementById("try-example-btn"),
  clearButton: document.getElementById("clear-btn"),
  downloadCsvButton: document.getElementById("download-csv-btn"),
  placeholder: document.getElementById("results-placeholder"),
  loadingState: document.getElementById("loading-state"),
  errorState: document.getElementById("error-state"),
  resultsCard: document.getElementById("results-card"),
};

// Toggle the loading state while the request is in flight.
function setLoading(isLoading) {
  ui.loadingState.classList.toggle("hidden", !isLoading);

  if (isLoading) {
    ui.resultsCard.classList.add("hidden");
    ui.errorState.classList.add("hidden");
  }
}

// Display a friendly message when something goes wrong.
function showError(message) {
  ui.errorState.textContent = message;
  ui.errorState.classList.remove("hidden");
  ui.resultsCard.classList.add("hidden");
}

function clearResults() {
  ui.placeholder.classList.remove("hidden");
  ui.resultsCard.classList.add("hidden");
  ui.errorState.classList.add("hidden");
  ui.downloadCsvButton.classList.add("hidden");
  ui.resultsCard.innerHTML = "";
}

function loadExampleTickets() {
  const exampleTickets = `I cannot log into my account. I've tried resetting my password but I'm not receiving the reset email. This is blocking me from doing my work.

Our billing system is down and customers cannot process payments. This is affecting all users and needs immediate attention.

The application is running very slow today. Page load times are taking 10+ seconds which is impacting user experience.

I need to request a new feature for the dashboard. It would be great to have a weekly summary report emailed to managers.

There's a bug in the reporting module where the export to CSV function is throwing an error when there are more than 1000 rows.

I need to update my user permissions. I should have access to the admin panel but I'm getting a permission denied error.`;

  ui.ticketInput.value = exampleTickets;
  updateTicketCount();
  clearResults();
  ui.ticketInput.focus();
}

function updateTicketCount() {
  const ticketTexts = parseTickets(ui.ticketInput.value);
  ui.ticketCountValue.textContent = ticketTexts.length;
}

function handleDragOver(e) {
  e.preventDefault();
  ui.ticketInput.classList.add("drag-over");
}

function handleDragLeave(e) {
  e.preventDefault();
  ui.ticketInput.classList.remove("drag-over");
}

function handleDrop(e) {
  e.preventDefault();
  ui.ticketInput.classList.remove("drag-over");

  const files = e.dataTransfer.files;
  if (files.length === 0) return;

  const file = files[0];
  if (!file.type.match("text.*") && !file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
    showError("Please drop a text file (.txt, .md) containing ticket information.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    ui.ticketInput.value = event.target.result;
    updateTicketCount();
    clearResults();
    ui.ticketInput.focus();
  };
  reader.onerror = () => {
    showError("Failed to read the file. Please try again.");
  };
  reader.readAsText(file);
}

const priorityOrder = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPriorityBadgeClass(priority) {
  const normalizedPriority = (priority || "").toLowerCase();
  switch (normalizedPriority) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    default:
      return "";
  }
}

function escapeCsv(value) {
  const stringValue = String(value || "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function resultsToCsv(results) {
  const headers = ["Ticket", "Issue Type", "Priority", "Suggested Team", "Explanation"];
  const csvRows = [headers.join(",")];

  results.forEach((result) => {
    const row = [
      escapeCsv(result.ticket),
      escapeCsv(result.issueType),
      escapeCsv(result.priority),
      escapeCsv(result.suggestedTeam),
      escapeCsv(result.explanation),
    ];
    csvRows.push(row.join(","));
  });

  return csvRows.join("\n");
}

function downloadCsv(results) {
  const csvContent = resultsToCsv(results);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `ticket-analysis-${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function normalizeResult(result, ticketText = "") {
  const issueType = result.issueType || "Other";
  const priority = result.priority || "Medium";
  const suggestedTeam = result.suggestedTeam || "Support";
  const explanation = result.explanation || "No explanation was provided.";
  const ticket = ticketText || result.ticket || result.ticketText || "";

  return {
    ticket,
    issueType,
    priority,
    suggestedTeam,
    explanation,
  };
}

function parseTickets(rawText) {
  // Normalize line endings and split by double newlines
  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized
    .split(/\n\s*\n/)
    .map((ticket) => ticket.trim())
    .filter(Boolean);
}

function buildResultsMarkup(results) {
  // Group by suggested team, then sort by priority within each team
  const groupedByTeam = results.reduce((acc, result) => {
    const team = result.suggestedTeam || "Support";
    if (!acc[team]) {
      acc[team] = [];
    }
    acc[team].push(result);
    return acc;
  }, {});

  // Sort teams alphabetically for consistent display
  const sortedTeams = Object.keys(groupedByTeam).sort();

  // Sort tickets within each team by priority (highest first)
  sortedTeams.forEach(team => {
    groupedByTeam[team].sort((a, b) => {
      const left = priorityOrder[a.priority] ?? Number.MAX_SAFE_INTEGER;
      const right = priorityOrder[b.priority] ?? Number.MAX_SAFE_INTEGER;
      return left - right;
    });
  });

  return `
    <div class="results-stack">
      <div class="results-header">
        <h3>${results.length > 1 ? "Priority Queue" : "Analysis Result"}</h3>
        <span>${results.length} ticket${results.length === 1 ? "" : "s"}</span>
      </div>
      <div class="results-list">
        ${sortedTeams
          .map(
            (team) => `
              <div class="team-section">
                <button class="team-toggle" aria-expanded="true" data-team="${escapeHtml(team)}">
                  <h4 class="team-header">${escapeHtml(team)}</h4>
                  <span class="toggle-icon">▼</span>
                </button>
                <div class="team-tickets">
                  ${groupedByTeam[team]
                    .map(
                      (result) => `
                        <article class="result-card">
                          <div class="result-card-header">
                            <strong>${escapeHtml(result.ticket || "Ticket")}</strong>
                            <span class="badge ${getPriorityBadgeClass(result.priority)}">${escapeHtml(result.priority)}</span>
                          </div>
                          <div class="result-grid">
                            <div class="result-item">
                              <strong>Issue Type</strong>
                              <span class="badge secondary-badge">${escapeHtml(result.issueType)}</span>
                            </div>
                            <div class="result-item">
                              <strong>Suggested Team</strong>
                              <span>${escapeHtml(result.suggestedTeam)}</span>
                            </div>
                            <div class="result-item">
                              <strong>Why this was chosen</strong>
                              <span>${escapeHtml(result.explanation)}</span>
                            </div>
                          </div>
                        </article>
                      `
                    )
                    .join("")}
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderResults(resultOrResults) {
  const entries = Array.isArray(resultOrResults) ? resultOrResults : [resultOrResults];
  const normalized = entries.map((entry, index) => normalizeResult(entry, entry.ticket || entry.ticketText || ""));
  ui.resultsCard.innerHTML = buildResultsMarkup(normalized);
  ui.resultsCard.classList.remove("hidden");
  ui.placeholder.classList.add("hidden");
  ui.downloadCsvButton.classList.remove("hidden");
  ui.downloadCsvButton.dataset.results = JSON.stringify(normalized);
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

// Simple local classifier used when no API key is supplied.
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

  const explanation = `The ticket references ${issueType.toLowerCase()} patterns and ${priority.toLowerCase()} urgency, so it is best routed to ${suggestedTeam}.`;

  return {
    issueType,
    priority,
    suggestedTeam,
    explanation,
  };
}

// Analyze tickets using OpenAI API (if key provided) or fallback classifier
async function analyzeTickets(tickets, apiKey) {
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
      throw new Error(`Failed to analyze ticket: ${error.message}`);
    }
  }

  return results;
}

async function handleAnalyze() {
  const ticketTexts = parseTickets(ui.ticketInput.value);
  const apiKey = ui.apiKeyInput.value.trim();

  if (!ticketTexts.length) {
    showError("Please paste one or more support tickets before analyzing them.");
    return;
  }

  setLoading(true);

  try {
    const result = await analyzeTickets(ticketTexts, apiKey);
    renderResults(result);
  } catch (error) {
    showError(error.message || "An unexpected error occurred while analyzing the tickets.");
  } finally {
    setLoading(false);
  }
}

function attachEvents() {
  ui.analyzeButton.addEventListener("click", handleAnalyze);
  ui.tryExampleButton.addEventListener("click", loadExampleTickets);
  ui.clearButton.addEventListener("click", () => {
    ui.ticketInput.value = "";
    ui.apiKeyInput.value = "";
    updateTicketCount();
    clearResults();
    ui.ticketInput.focus();
  });

  // Update ticket count on textarea input
  ui.ticketInput.addEventListener("input", updateTicketCount);

  // Drag and drop events
  ui.ticketInput.addEventListener("dragover", handleDragOver);
  ui.ticketInput.addEventListener("dragleave", handleDragLeave);
  ui.ticketInput.addEventListener("drop", handleDrop);

  // Team toggle event delegation
  ui.resultsCard.addEventListener("click", (e) => {
    const toggleButton = e.target.closest(".team-toggle");
    if (toggleButton) {
      const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
      toggleButton.setAttribute("aria-expanded", !isExpanded);
    }
  });

  // Download CSV button
  ui.downloadCsvButton.addEventListener("click", () => {
    const results = JSON.parse(ui.downloadCsvButton.dataset.results || "[]");
    downloadCsv(results);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  attachEvents();
  clearResults();
  ui.ticketInput.focus();
});

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
  apiKeyInput: document.getElementById("api-key"),
  analyzeButton: document.getElementById("analyze-btn"),
  clearButton: document.getElementById("clear-btn"),
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
  ui.resultsCard.innerHTML = "";
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
  const sortedResults = [...results].sort((a, b) => {
    const left = priorityOrder[a.priority] ?? Number.MAX_SAFE_INTEGER;
    const right = priorityOrder[b.priority] ?? Number.MAX_SAFE_INTEGER;
    return left - right;
  });

  return `
    <div class="results-stack">
      <div class="results-header">
        <h3>${sortedResults.length > 1 ? "Priority Queue" : "Analysis Result"}</h3>
        <span>${sortedResults.length} ticket${sortedResults.length === 1 ? "" : "s"}</span>
      </div>
      <div class="results-list">
        ${sortedResults
          .map(
            (result) => `
              <article class="result-card">
                <div class="result-card-header">
                  <strong>${escapeHtml(result.ticket || "Ticket")}</strong>
                  <span class="badge">${escapeHtml(result.priority)}</span>
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
  `;
}

function renderResults(resultOrResults) {
  const entries = Array.isArray(resultOrResults) ? resultOrResults : [resultOrResults];
  const normalized = entries.map((entry, index) => normalizeResult(entry, entry.ticket || entry.ticketText || ""));
  ui.resultsCard.innerHTML = buildResultsMarkup(normalized);
  ui.resultsCard.classList.remove("hidden");
  ui.placeholder.classList.add("hidden");
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

// Send one or more tickets to the server-side endpoint, which may call OpenAI or use a fallback classifier.
async function analyzeTickets(tickets, apiKey) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tickets, apiKey }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || "The analysis request failed.");
  }

  return response.json();
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
  ui.clearButton.addEventListener("click", () => {
    ui.ticketInput.value = "";
    ui.apiKeyInput.value = "";
    clearResults();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  attachEvents();
  clearResults();
});

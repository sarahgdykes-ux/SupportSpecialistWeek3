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
  ui.placeholder.classList.toggle("hidden", isLoading);
  ui.resultsCard.classList.add("hidden");
  ui.errorState.classList.add("hidden");
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

function normalizeResult(result) {
  const issueType = result.issueType || "Other";
  const priority = result.priority || "Medium";
  const suggestedTeam = result.suggestedTeam || "Support";
  const explanation = result.explanation || "No explanation was provided.";

  return {
    issueType,
    priority,
    suggestedTeam,
    explanation,
  };
}

function buildResultMarkup(result) {
  return `
    <div class="result-grid">
      <div class="result-item">
        <strong>Issue Type</strong>
        <span class="badge">${result.issueType}</span>
      </div>
      <div class="result-item">
        <strong>Priority</strong>
        <span class="badge">${result.priority}</span>
      </div>
      <div class="result-item">
        <strong>Suggested Team</strong>
        <span>${result.suggestedTeam}</span>
      </div>
      <div class="result-item">
        <strong>Why this was chosen</strong>
        <span>${result.explanation}</span>
      </div>
    </div>
  `;
}

function renderResults(result) {
  const normalized = normalizeResult(result);
  ui.resultsCard.innerHTML = buildResultMarkup(normalized);
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

// Send the ticket to the server-side endpoint, which may call OpenAI or use a fallback classifier.
async function analyzeTicket(ticketText, apiKey) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ticketText, apiKey }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || "The analysis request failed.");
  }

  return response.json();
}

async function handleAnalyze() {
  const ticketText = ui.ticketInput.value.trim();
  const apiKey = ui.apiKeyInput.value.trim();

  if (!ticketText) {
    showError("Please paste a support ticket before analyzing it.");
    return;
  }

  setLoading(true);

  try {
    const result = await analyzeTicket(ticketText, apiKey);
    renderResults(result);
  } catch (error) {
    showError(error.message || "An unexpected error occurred while analyzing the ticket.");
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

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
  darkModeToggle: document.getElementById("dark-mode-toggle"),
  csvFileInput: document.getElementById("csv-file-input"),
  csvFileName: document.getElementById("csv-file-name"),
  placeholder: document.getElementById("results-placeholder"),
  loadingState: document.getElementById("loading-state"),
  errorState: document.getElementById("error-state"),
  searchContainer: document.getElementById("search-container"),
  ticketSearch: document.getElementById("ticket-search"),
  bulkActions: document.getElementById("bulk-actions"),
  selectAllBtn: document.getElementById("select-all-btn"),
  sendSelectedBtn: document.getElementById("send-selected-btn"),
  statisticsDashboard: document.getElementById("statistics-dashboard"),
  resultsCard: document.getElementById("results-card"),
  formPanel: document.getElementById("form-panel"),
  resultsPanel: document.getElementById("results-panel"),
  statisticsPanel: document.getElementById("statistics-panel"),
  supportPanel: document.getElementById("support-panel"),
  engineeringPanel: document.getElementById("engineering-panel"),
  billingPanel: document.getElementById("billing-panel"),
  infrastructurePanel: document.getElementById("infrastructure-panel"),
  productPanel: document.getElementById("product-panel"),
  supportTickets: document.getElementById("support-tickets"),
  engineeringTickets: document.getElementById("engineering-tickets"),
  billingTickets: document.getElementById("billing-tickets"),
  infrastructureTickets: document.getElementById("infrastructure-tickets"),
  productTickets: document.getElementById("product-tickets"),
  navTabs: document.querySelectorAll(".nav-tab"),
};

// Store sent tickets by department
const departmentTickets = {
  support: [],
  engineering: [],
  billing: [],
  infrastructure: [],
  product: []
};

// Render a single ticket card for department views
function buildDepartmentTicketCard(ticket, index) {
  const ticketText = ticket.ticket || "";
  const isLong = ticketText.length > 100;
  const previewText = isLong ? ticketText.substring(0, 100) + "..." : ticketText;

  return `
    <article class="result-card" data-ticket-index="${index}">
      <div class="result-card-header">
        <span class="ticket-id-badge">ID: ${escapeHtml(ticket.ticketId || (index + 1))}</span>
        <div class="ticket-description-wrapper">
          <strong class="ticket-description ${isLong ? 'collapsed' : ''}" data-full-text="${escapeHtml(ticketText)}">${escapeHtml(previewText)}</strong>
          ${isLong ? `<button class="expand-toggle" data-ticket-index="${index}">Show more</button>` : ''}
        </div>
        <span class="badge ${getPriorityBadgeClass(ticket.priority)}">${escapeHtml(ticket.priority || 'Medium')}</span>
      </div>
      <div class="result-grid">
        <div class="result-item">
          <strong>Issue Type:</strong>
          <span>${escapeHtml(ticket.issueType || 'Other')}</span>
        </div>
        <div class="result-item">
          <strong>Resolution:</strong>
          <span>${escapeHtml(ticket.resolution || 'Pending')}</span>
        </div>
      </div>
    </article>
  `;
}

// Render all tickets for a specific department
function renderDepartmentTickets(department) {
  const tickets = departmentTickets[department] || [];
  const container = ui[`${department}Tickets`];
  
  if (tickets.length === 0) {
    container.innerHTML = '<div class="results-placeholder" style="min-height: 100px;">No tickets sent to this department yet.</div>';
  } else {
    container.innerHTML = tickets.map((ticket, index) => buildDepartmentTicketCard(ticket, index)).join('');
  }
}

// Toggle the loading state while the request is in flight.
function setLoading(isLoading) {
  ui.loadingState.classList.toggle("hidden", !isLoading);

  if (isLoading) {
    ui.resultsCard.classList.add("hidden");
    ui.errorState.classList.add("hidden");
  }
}

// Switch between Input, Results, Statistics, and Department views
function switchView(view) {
  ui.navTabs.forEach(tab => {
    if (tab.dataset.view === view) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Hide all panels first
  ui.formPanel.style.display = "none";
  ui.resultsPanel.style.display = "none";
  ui.statisticsPanel.style.display = "none";
  ui.supportPanel.style.display = "none";
  ui.engineeringPanel.style.display = "none";
  ui.billingPanel.style.display = "none";
  ui.infrastructurePanel.style.display = "none";
  ui.productPanel.style.display = "none";

  // Show the selected panel
  if (view === "form") {
    ui.formPanel.style.display = "flex";
  } else if (view === "results") {
    ui.resultsPanel.style.display = "flex";
  } else if (view === "statistics") {
    ui.statisticsPanel.style.display = "flex";
  } else if (view === "support") {
    ui.supportPanel.style.display = "flex";
    renderDepartmentTickets("support");
  } else if (view === "engineering") {
    ui.engineeringPanel.style.display = "flex";
    renderDepartmentTickets("engineering");
  } else if (view === "billing") {
    ui.billingPanel.style.display = "flex";
    renderDepartmentTickets("billing");
  } else if (view === "infrastructure") {
    ui.infrastructurePanel.style.display = "flex";
    renderDepartmentTickets("infrastructure");
  } else if (view === "product") {
    ui.productPanel.style.display = "flex";
    renderDepartmentTickets("product");
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
  ui.searchContainer.classList.add("hidden");
  ui.bulkActions.classList.add("hidden");
  ui.statisticsDashboard.classList.add("hidden");
  ui.downloadCsvButton.classList.add("hidden");
  ui.resultsCard.innerHTML = "";
  ui.ticketSearch.value = "";
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

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("darkMode", isDark);
  ui.darkModeToggle.querySelector(".dark-mode-icon").textContent = isDark ? "☀️" : "🌙";
}

function initDarkMode() {
  const savedDarkMode = localStorage.getItem("darkMode");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = savedDarkMode === "true" || (savedDarkMode === null && prefersDark);

  if (shouldUseDark) {
    document.documentElement.classList.add("dark");
    ui.darkModeToggle.querySelector(".dark-mode-icon").textContent = "☀️";
  }
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = [];
    let currentValue = '';
    let inQuotes = false;

    for (let char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index].replace(/^"|"$/g, '');
      });
      data.push(row);
    }
  }

  return data;
}

function cleanTicketData(row) {
  let description = row['Ticket Description'] || '';
  const product = row['Product Purchased'] || '';

  // Replace {product_purchased} placeholder with actual product name
  description = description.replace(/\{product_purchased\}/gi, product);

  // Remove common template/garbage text patterns
  const garbagePatterns = [
    /I'm having an issue with the \{?product_purchased\}?\s*\.?\s*Please assist\./gi,
    /I'm facing a problem with my \{?product_purchased\}?\s*\.?\s*/gi,
    /Your billing zip code is: \d+\./gi,
    /We appreciate that you have requested a website address\./gi,
    /Please double check your email address\./gi,
    /If you need to change an existing product\./gi,
    /If The issue I'm facing is intermittent\./gi,
    /Note: The seller is not responsible for any damages.*?shipped to you/gi,
    /To remove the new \{?product_purch/gi,
    /Solution \d+\s*/gi,
    /Product Search: What's New in \d+-\d+-\d+-\d+\?/gi,
    /Report Feedback Customer Service is your best/gi,
    /CQW: Why didn't I send him the invoice\? Thanks a lot\./gi,
    /L: He's like the best customer I've met\./gi,
    /I can't find the 'Product_IP' field of the/gi,
    /Product Name: [A-Z0-9]+/gi,
    /Join Date: [A-Za-z]+ \d+ Posts: \d+/gi,
    /- Acknowledgement: Thanks to \w+ for the tip\./gi,
    /\* \[0\] - \[0\] - \[0\] - \[0\]/gi,
    /Customer Reviewer: [^.]*\./gi,
    /"" -name ""[^"]*""/gi,
    /"" -version [\d.]+ ""[\d.]+""/gi,
    /"" -usage/gi,
    /The email address should change to: [^,]+, as there is a unique id number unique for each product\./gi,
    /1\.\d+(\.\d+)?\s*/gi,
    /\{?product_purchased\}? does not represent the price which you received by the day immediately before the shipment date\./gi,
    /In many cases, this is the/gi,
    /\} If we can, please send a ""request"" to [^\s]+/gi,
    /1-800-\d{3}-\d{4}\./gi,
    /\d+\.\s+It is possible that we cannot find some type of text or a product name to identify someone like [^.]*\./gi,
    /\d+\.\s+On the/gi,
  ];

  garbagePatterns.forEach(pattern => {
    description = description.replace(pattern, '');
  });

  // Clean up extra whitespace and line breaks
  description = description.replace(/\n\s*\n/g, '\n\n');
  description = description.replace(/^\s+|\s+$/gm, '');
  description = description.trim();

  // Remove empty lines
  description = description.replace(/\n\s*\n\s*\n/g, '\n\n');

  return description;
}

function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  ui.csvFileName.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const csvText = e.target.result;
      const data = parseCSV(csvText);

      if (data.length === 0) {
        showError("No valid data found in CSV file.");
        return;
      }

      // Extract ticket descriptions and clean them, preserving Ticket ID
      const tickets = data.map(row => ({
        id: row['Ticket ID'] || '',
        description: cleanTicketData(row)
      })).filter(t => t.description.length > 0);

      if (tickets.length === 0) {
        showError("No valid ticket descriptions found in CSV file.");
        return;
      }

      // Store ticket IDs for later use
      ui.ticketInput.dataset.ticketIds = JSON.stringify(tickets.map(t => t.id));

      // Populate textarea with cleaned tickets
      ui.ticketInput.value = tickets.map(t => t.description).join('\n\n');
      updateTicketCount();
      clearResults();
      ui.ticketInput.focus();

    } catch (error) {
      showError("Failed to parse CSV file: " + error.message);
    }
  };

  reader.onerror = () => {
    showError("Failed to read the CSV file. Please try again.");
  };

  reader.readAsText(file);
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
  const headers = ["Ticket ID", "Ticket", "Issue Type", "Priority", "Suggested Team", "Explanation"];
  const csvRows = [headers.join(",")];

  results.forEach((result) => {
    const row = [
      escapeCsv(result.ticketId),
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
                <button class="team-toggle" aria-expanded="false" data-team="${escapeHtml(team)}">
                  <h4 class="team-header">${escapeHtml(team)} <span class="team-ticket-count">(${groupedByTeam[team].length})</span></h4>
                  <span class="toggle-icon">▼</span>
                </button>
                <div class="team-tickets">
                  ${groupedByTeam[team]
                    .map(
                      (result, index) => {
                        const ticketText = result.ticket || "";
                        const isLong = ticketText.length > 100;
                        const previewText = isLong ? ticketText.substring(0, 100) + "..." : ticketText;
                        
                        return `
                        <article class="result-card" data-ticket-index="${index}">
                          <div class="result-card-header">
                            <input type="checkbox" class="ticket-checkbox" data-ticket-index="${index}" />
                            <span class="ticket-id-badge">ID: ${escapeHtml(result.ticketId || (index + 1))}</span>
                            <div class="ticket-description-wrapper">
                              <strong class="ticket-description ${isLong ? 'collapsed' : ''}" data-full-text="${escapeHtml(ticketText)}">${escapeHtml(previewText)}</strong>
                              ${isLong ? `<button class="expand-toggle" data-ticket-index="${index}">Show more</button>` : ''}
                            </div>
                            <select class="priority-select ${getPriorityBadgeClass(result.priority)}" data-ticket-index="${index}">
                              ${priorityOptions.map(p => `<option value="${escapeHtml(p)}" ${p === result.priority ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}
                            </select>
                          </div>
                          <div class="result-grid">
                            <div class="result-item">
                              <strong>Issue Type</strong>
                              <span class="badge secondary-badge">${escapeHtml(result.issueType)}</span>
                            </div>
                            <div class="result-item">
                              <strong>Suggested Team</strong>
                              <select class="team-select" data-ticket-index="${index}">
                                ${teamOptions.map(t => `<option value="${escapeHtml(t)}" ${t === result.suggestedTeam ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
                              </select>
                            </div>
                            <div class="result-item">
                              <strong>Why this was chosen</strong>
                              <span>${escapeHtml(result.explanation)}</span>
                            </div>
                          </div>
                        </article>
                      `;
                      }
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
  
  // Calculate and render statistics
  const stats = calculateStatistics(normalized);
  ui.statisticsDashboard.innerHTML = renderStatistics(stats);
  ui.statisticsDashboard.classList.remove("hidden");
  
  ui.resultsCard.innerHTML = buildResultsMarkup(normalized);
  ui.resultsCard.classList.remove("hidden");
  ui.placeholder.classList.add("hidden");
  ui.searchContainer.classList.remove("hidden");
  ui.bulkActions.classList.remove("hidden");
  ui.downloadCsvButton.classList.remove("hidden");
  ui.downloadCsvButton.dataset.results = JSON.stringify(normalized);
  ui.ticketSearch.dataset.allResults = JSON.stringify(normalized);
  updateSelectedCount();
  
  // Switch to results view
  switchView("results");
}

function filterResults(searchTerm) {
  const allResults = JSON.parse(ui.ticketSearch.dataset.allResults || "[]");
  
  if (!searchTerm.trim()) {
    ui.resultsCard.innerHTML = buildResultsMarkup(allResults);
    updateSelectedCount();
    return;
  }
  
  const term = searchTerm.toLowerCase();
  const filtered = allResults.filter(result => {
    const ticketId = String(result.ticketId || "").toLowerCase();
    const ticket = (result.ticket || "").toLowerCase();
    const issueType = (result.issueType || "").toLowerCase();
    const priority = (result.priority || "").toLowerCase();
    const team = (result.suggestedTeam || "").toLowerCase();
    
    return ticketId.includes(term) || 
           ticket.includes(term) || 
           issueType.includes(term) ||
           priority.includes(term) ||
           team.includes(term);
  });
  
  ui.resultsCard.innerHTML = buildResultsMarkup(filtered);
  updateSelectedCount();
}

function updateSelectedCount() {
  const checkboxes = document.querySelectorAll('.ticket-checkbox');
  const selected = Array.from(checkboxes).filter(cb => cb.checked).length;
  ui.sendSelectedBtn.textContent = `Send Selected (${selected})`;
  
  // Update select all button text
  const allChecked = selected === checkboxes.length && checkboxes.length > 0;
  ui.selectAllBtn.textContent = allChecked ? 'Deselect All' : 'Select All';
}

function calculateStatistics(results) {
  const stats = {
    total: results.length,
    byTeam: {},
    byPriority: {},
    byIssueType: {},
    sent: 0
  };

  results.forEach(result => {
    // Count by team
    const team = result.suggestedTeam || 'Unknown';
    stats.byTeam[team] = (stats.byTeam[team] || 0) + 1;

    // Count by priority
    const priority = result.priority || 'Unknown';
    stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

    // Count by issue type
    const issueType = result.issueType || 'Unknown';
    stats.byIssueType[issueType] = (stats.byIssueType[issueType] || 0) + 1;
  });

  return stats;
}

function renderStatistics(stats) {
  const teamEntries = Object.entries(stats.byTeam).sort((a, b) => b[1] - a[1]);
  const priorityEntries = Object.entries(stats.byPriority).sort((a, b) => b[1] - a[1]);
  const issueEntries = Object.entries(stats.byIssueType).sort((a, b) => b[1] - a[1]);

  const maxTeamCount = Math.max(...teamEntries.map(([, count]) => count), 1);
  const maxPriorityCount = Math.max(...priorityEntries.map(([, count]) => count), 1);

  return `
    <div class="stats-header">
      <h3>Statistics Dashboard</h3>
      <span class="stats-total">${stats.total} ticket${stats.total === 1 ? '' : 's'}</span>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <h4>Tickets by Team</h4>
        <div class="stat-bars">
          ${teamEntries.map(([team, count]) => `
            <div class="stat-bar">
              <span class="stat-label">${escapeHtml(team)}</span>
              <div class="stat-bar-container">
                <div class="stat-bar-fill" style="width: ${(count / maxTeamCount) * 100}%"></div>
              </div>
              <span class="stat-value">${count}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="stat-card">
        <h4>Tickets by Priority</h4>
        <div class="stat-bars">
          ${priorityEntries.map(([priority, count]) => `
            <div class="stat-bar">
              <span class="stat-label priority-${priority.toLowerCase()}">${escapeHtml(priority)}</span>
              <div class="stat-bar-container">
                <div class="stat-bar-fill priority-${priority.toLowerCase()}" style="width: ${(count / maxPriorityCount) * 100}%"></div>
              </div>
              <span class="stat-value">${count}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="stat-card">
        <h4>Tickets by Issue Type</h4>
        <div class="stat-bars">
          ${issueEntries.map(([issue, count]) => `
            <div class="stat-bar">
              <span class="stat-label">${escapeHtml(issue)}</span>
              <div class="stat-bar-container">
                <div class="stat-bar-fill" style="width: ${(count / stats.total) * 100}%"></div>
              </div>
              <span class="stat-value">${count}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
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
            "You are a support triage assistant. Return strict JSON with issueType, priority, suggestedTeam, explanation. Use the categories: Login Issue, Password Reset, Billing, Bug Report, Feature Request, Performance, Account Management, Hardware Issue, Other; priorities: Low, Medium, High, Critical; teams: Support, Engineering, Billing, Infrastructure, Product. IMPORTANT: Distinguish between 'charger/charging' (hardware/power device - Engineering team) and 'charge' (billing/payment - Billing team). If the ticket mentions charger, charging, battery, power, plug, or cable with 'charge', classify as Hardware Issue for Engineering team.",
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
  } else if (text.includes("charger") || text.includes("charging") || (text.includes("charge") && (text.includes("battery") || text.includes("power") || text.includes("plug") || text.includes("cable")))) {
    issueType = "Hardware Issue";
    suggestedTeam = "Engineering";
  } else if (text.includes("bill") || text.includes("invoice") || (text.includes("charge") && (text.includes("credit") || text.includes("payment") || text.includes("card") || text.includes("amount")))) {
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
  
  // Get ticket IDs if they were stored from CSV upload
  const ticketIds = ui.ticketInput.dataset.ticketIds 
    ? JSON.parse(ui.ticketInput.dataset.ticketIds) 
    : [];

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    try {
      const result = apiKey
        ? await analyzeWithOpenAI(ticket, apiKey)
        : getFallbackAnalysis(ticket);

      results.push({
        ticketId: ticketIds[i] || (i + 1), // Use stored ID or fall back to index + 1
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

  // Priority select change
  ui.resultsCard.addEventListener("change", (e) => {
    if (e.target.classList.contains("priority-select")) {
      const ticketIndex = e.target.dataset.ticketIndex;
      const newPriority = e.target.value;
      const results = JSON.parse(ui.downloadCsvButton.dataset.results || "[]");
      
      if (results[ticketIndex]) {
        results[ticketIndex].priority = newPriority;
        ui.downloadCsvButton.dataset.results = JSON.stringify(results);
        
        // Update badge class
        e.target.className = `priority-select ${getPriorityBadgeClass(newPriority)}`;
      }
    }
    
    if (e.target.classList.contains("team-select")) {
      const ticketIndex = e.target.dataset.ticketIndex;
      const newTeam = e.target.value;
      const results = JSON.parse(ui.downloadCsvButton.dataset.results || "[]");
      
      if (results[ticketIndex]) {
        results[ticketIndex].suggestedTeam = newTeam;
        ui.downloadCsvButton.dataset.results = JSON.stringify(results);
      }
    }
  });

  // Download CSV button
  ui.downloadCsvButton.addEventListener("click", () => {
    const results = JSON.parse(ui.downloadCsvButton.dataset.results || "[]");
    downloadCsv(results);
  });

  // Dark mode toggle
  ui.darkModeToggle.addEventListener("click", toggleDarkMode);

  // CSV file upload
  ui.csvFileInput.addEventListener("change", handleCSVUpload);

  // Search functionality
  ui.ticketSearch.addEventListener("input", (e) => {
    filterResults(e.target.value);
  });

  // Checkbox change events
  ui.resultsCard.addEventListener("change", (e) => {
    if (e.target.classList.contains("ticket-checkbox")) {
      updateSelectedCount();
    }
  });

  // Select All / Deselect All
  ui.selectAllBtn.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll('.ticket-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
      cb.checked = !allChecked;
    });
    
    updateSelectedCount();
  });

  // Navigation tabs
  ui.navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      switchView(tab.dataset.view);
    });
  });

  // Send Selected
  ui.sendSelectedBtn.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll('.ticket-checkbox:checked');
    const results = JSON.parse(ui.downloadCsvButton.dataset.results || "[]");
    
    if (checkboxes.length === 0) {
      alert("Please select at least one ticket to send.");
      return;
    }
    
    const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.ticketIndex));
    const sentTickets = [];
    const ticketsToRemove = [];
    
    selectedIndices.forEach(index => {
      if (results[index]) {
        const ticket = results[index];
        const team = ticket.suggestedTeam || "support";
        const teamKey = team.toLowerCase();
        
        // Add ticket to department
        if (departmentTickets[teamKey]) {
          departmentTickets[teamKey].push(ticket);
        }
        
        sentTickets.push({
          id: ticket.ticketId,
          team: team
        });
        
        ticketsToRemove.push(index);
        
        // Uncheck the checkbox
        checkboxes.find(cb => parseInt(cb.dataset.ticketIndex) === index).checked = false;
      }
    });
    
    // Remove sent tickets from results (in reverse order to maintain indices)
    ticketsToRemove.sort((a, b) => b - a).forEach(index => {
      results.splice(index, 1);
    });
    
    // Update the stored results
    ui.downloadCsvButton.dataset.results = JSON.stringify(results);
    ui.ticketSearch.dataset.allResults = JSON.stringify(results);
    
    // Re-render results
    if (results.length === 0) {
      ui.placeholder.classList.remove("hidden");
      ui.resultsCard.classList.add("hidden");
      ui.searchContainer.classList.add("hidden");
      ui.bulkActions.classList.add("hidden");
      ui.downloadCsvButton.classList.add("hidden");
    } else {
      ui.resultsCard.innerHTML = buildResultsMarkup(results);
    }
    
    updateSelectedCount();
    
    // Show confirmation
    const teamGroups = sentTickets.reduce((acc, ticket) => {
      acc[ticket.team] = (acc[ticket.team] || 0) + 1;
      return acc;
    }, {});
    
    const message = Object.entries(teamGroups)
      .map(([team, count]) => `${count} ticket(s) to ${team}`)
      .join(', ');
    
    alert(`Sent: ${message}`);
    console.log("Sent tickets:", sentTickets);
    
    // Switch to the first department that received tickets
    if (sentTickets.length > 0) {
      const firstTeam = sentTickets[0].team.toLowerCase();
      switchView(firstTeam);
    }
  });

  // Priority and team dropdown change handlers
  ui.resultsCard.addEventListener("change", (e) => {
    if (e.target.classList.contains("priority-select") || e.target.classList.contains("team-select")) {
      const ticketIndex = parseInt(e.target.dataset.ticketIndex);
      const results = JSON.parse(ui.downloadCsvButton.dataset.results || "[]");
      
      if (results[ticketIndex]) {
        // Update the ticket data
        if (e.target.classList.contains("priority-select")) {
          results[ticketIndex].priority = e.target.value;
        } else if (e.target.classList.contains("team-select")) {
          results[ticketIndex].suggestedTeam = e.target.value;
        }
        
        // Update the stored results
        ui.downloadCsvButton.dataset.results = JSON.stringify(results);
        ui.ticketSearch.dataset.allResults = JSON.stringify(results);
        
        // Re-render results with new grouping and sorting
        ui.resultsCard.innerHTML = buildResultsMarkup(results);
        updateSelectedCount();
      }
    }
  });

  // Expand/collapse toggle
  ui.resultsCard.addEventListener("click", (e) => {
    if (e.target.classList.contains("expand-toggle")) {
      const descriptionEl = e.target.previousElementSibling;
      const fullText = descriptionEl.dataset.fullText;
      
      if (e.target.textContent === "Show more") {
        descriptionEl.textContent = fullText;
        descriptionEl.classList.remove("collapsed");
        e.target.textContent = "Show less";
      } else {
        const previewText = fullText.substring(0, 100) + "...";
        descriptionEl.textContent = previewText;
        descriptionEl.classList.add("collapsed");
        e.target.textContent = "Show more";
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  attachEvents();
  clearResults();
  ui.ticketInput.focus();
  initDarkMode();
});

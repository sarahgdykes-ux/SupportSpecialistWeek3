# SupportSpecialistWeek3

A simple MVP web app for AI-assisted support ticket triage.

## Run locally

Simply open `index.html` in your web browser. No server required.

## Deployment

This is a static application that can be deployed to any static hosting service:

### Vercel
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and connect your GitHub repo
4. Deploy - Vercel will auto-detect it as a static site

### Netlify
1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repo and deploy

### GitHub Pages
1. Push your code to GitHub
2. Go to repo Settings → Pages
3. Select the main branch and save
4. Your site will be available at `https://username.github.io/repo-name`

## Features

- **AI-powered analysis**: Uses OpenAI GPT-4o-mini when API key is provided
- **Fallback classifier**: Built-in keyword-based analysis when no API key
- **Team grouping**: Results grouped by suggested team
- **Priority sorting**: Tickets sorted by priority within each team
- **Color-coded badges**: Visual priority indicators (Critical=red, High=orange, Medium=yellow, Low=green)
- **Expand/collapse**: Team sections can be collapsed for better navigation
- **CSV export**: Download analysis results as CSV file
- **Drag and drop**: Drop text files to load tickets
- **Try Example**: Load sample tickets to test the app

## Usage

1. Paste support tickets (one per paragraph or separated by blank lines)
2. Optionally enter an OpenAI API key for AI-powered analysis
3. Click "Analyze Tickets" to classify and prioritize
4. Review results grouped by team with priority sorting
5. Download CSV export if needed

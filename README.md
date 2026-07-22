# SupportSpecialistWeek3

A simple MVP web app for AI-assisted support ticket triage.

## Run locally

1. Install dependencies if needed:
   - `npm install`
2. Start the app:
   - `npm start`
3. Open `http://localhost:3000` in your browser.

## Notes

- The app works without an API key by using a built-in fallback classifier.
- To use OpenAI directly, set the `OPENAI_API_KEY` environment variable or enter an API key in the form before analyzing a ticket.

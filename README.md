# HirePilot

HirePilot is a React + Vite frontend for matching a resume to a job description. The `server/` directory contains an Express API for PDF text extraction, resume and job analysis, and a health check.

## Run the backend

```sh
cd server
npm install
cp .env.example .env
npm run dev
```

Set `ALLOWED_ORIGIN` to the exact origin serving the frontend (for local Vite, `http://localhost:5173`) and set `GEMINI_API_KEY` for analysis. The server defaults to port `3001`; the example environment sets it to `8080` to match the frontend's `.env.example`. Check `GET http://localhost:8080/health`; submit one PDF as multipart form data under the field name `file` to `POST http://localhost:8080/api/extract`. Send JSON `{ "resumeText": "...", "jobText": "..." }` to `POST http://localhost:8080/api/analyze` to receive a structured match analysis.

The API keeps uploads in memory, limits them to 5 MB, and returns extracted text only when at least 200 characters are found. Scanned or otherwise low-text PDFs receive a 422 response. Analysis inputs are limited to 15,000 characters each, and the analysis route allows 10 requests per minute per IP. Resume contents are not logged.

## Run the analysis evaluation

With `GEMINI_API_KEY` set in `server/.env`, run `cd server && node eval/run.js`. It evaluates six synthetic resume/job pairs, reports matched and missing skills against expected labels, and compares the prompt-injection case with a control run that omits the injected instruction.

# SurveyDonkey
A type-safe gamified survey platform built with React, Hono, and Drizzle ORM.

## Requirements
- Node.js 20+
- PostgreSQL
- Gemini API Key

## Run Locally
1. `npm install`
2. Set `DATABASE_URL` and `GEMINI_API_KEY` in `.env`.
3. `npm run db:migrate && npm run db:seed`
4. `npm run dev:all`

## Docker
```bash
docker build -t survey-donkey .
docker run -p 3000:3000 -e DATABASE_URL=... -e GEMINI_API_KEY=... survey-donkey
```

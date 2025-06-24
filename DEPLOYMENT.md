# Deployment Guide: InsightIQ

## 1. Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL
- OpenAI API key

## 2. Environment Setup
- Copy `.env.example` to `.env` in both `backend` and `frontend` (set your keys/URLs)
- Place your logo in `frontend/public/logo.png`

## 3. Backend (FastAPI)
- Install dependencies: `pip install -r requirements.txt`
- Run migrations (if using Alembic)
- Start server: `uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload`

## 4. Frontend (React)
- Install dependencies: `npm install` (or `yarn`)
- Build: `npm run build`
- Preview: `npm run preview` or deploy `dist/` to your static host

## 5. Production
- Set CORS and API URLs for your domain
- Use a production server (e.g., gunicorn, nginx, pm2)
- Secure your .env files and secrets

## 6. GitHub Commit Checklist
- [x] All secrets in `.env`, not in code
- [x] `.gitignore` excludes sensitive and build files
- [x] README and PROJECT_SUMMARY are up to date
- [x] Example .env files provided
- [x] No debug prints or test data in production

---

For more, see README.md and PROJECT_SUMMARY.md.

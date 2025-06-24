# InsightIQ

InsightIQ is a full-stack analytics dashboard and Deep Q&A assistant for CSV datasets. It enables users to upload, explore, analyze, and ask natural language questions about their data using advanced AI and ML techniques.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** FastAPI (Python)
- **Authentication:** JWT (JSON Web Token)
- **Data Science/ML:** Pandas, scikit-learn, Prophet, Matplotlib
- **AI Q&A:** OpenAI GPT (openai>=1.0.0), Sentence Transformers, FAISS
- **Database:** PostgreSQL (via SQLAlchemy ORM)
- **Other:** python-dotenv, Axios, CORS, dotenv, Vite (or CRA)

## Features

- Secure JWT authentication
- Upload and manage large CSV datasets
- Automatic chunking, embedding, and FAISS index creation for Q&A
- Modern, animated UI with responsive design
- Preview and summarize datasets
- Generate charts and ML insights (trend, forecast, regression, clustering, etc.)
- Deep Q&A: Ask natural language questions about your data
- Chat sidebar for interactive Q&A (appears when a dataset is selected)
- Robust error handling and debug logging

## Key Logic & Architecture

- **CSV Upload:** Main upload endpoint stores file in DB and triggers chunking/embedding for Q&A.
- **Chunking & Embedding:** Uses Pandas to chunk data, Sentence Transformers for embeddings, and FAISS for vector search.
- **Q&A Flow:** User asks a question, embedding is generated, FAISS finds relevant chunks, OpenAI GPT generates answer.
- **Frontend Integration:** ChatSidebar is a large, scrollable sidebar that appears when a dataset is selected, allowing long conversations.
- **ML Insights:** Uses scikit-learn and Prophet for regression, forecasting, and more.
- **Environment:** .env for secrets, public/logo.png for branding.

## How to Run

1. Clone the repo and install dependencies for both frontend and backend.
2. Place your OpenAI API key in `.env` in the backend folder.
3. Place your logo in `frontend/public/logo.png`.
4. Start backend (FastAPI) and frontend (React) servers.
5. Access the app at `http://localhost:5173` (or your configured port).

## Deployment
- Set production CORS and API URLs.
- Build frontend (`npm run build`).
- Serve static files and run backend with production server (e.g., uvicorn/gunicorn).

---

For more details, see the `PROJECT_SUMMARY.md` file.

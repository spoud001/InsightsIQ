# InsightIQ Project Summary

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** FastAPI (Python)
- **Authentication:** JWT (JSON Web Token)
- **Database:** PostgreSQL (SQLAlchemy ORM)
- **Data Science/ML:** Pandas, scikit-learn, Prophet, Matplotlib
- **AI/NLP:** OpenAI GPT (openai>=1.0.0), Sentence Transformers, FAISS
- **Other:** python-dotenv, Axios, CORS, dotenv, Vite (or CRA)

## Key Features
- Secure login and JWT authentication
- Upload, preview, and manage large CSV datasets
- Automatic chunking, embedding, and FAISS index creation for Q&A
- Modern, animated, responsive UI (Tailwind, React)
- Dataset preview and summary
- Chart and ML insight generation (trend, forecast, regression, clustering, etc.)
- Deep Q&A: Ask natural language questions about your data
- Chat sidebar for interactive Q&A (appears when a dataset is selected)
- Robust error handling and debug logging

## Backend Logic
- **Upload:** Stores CSV in DB, triggers chunking/embedding for Q&A
- **Chunking:** Pandas splits data into chunks for embedding
- **Embedding:** Sentence Transformers generate vector embeddings
- **FAISS:** Builds vector index for semantic search
- **Q&A:** User question is embedded, FAISS finds relevant chunks, OpenAI GPT generates answer
- **ML Insights:** scikit-learn and Prophet for regression, forecasting, clustering, etc.
- **Environment:** .env for secrets, python-dotenv for loading

## Frontend Logic
- **DatasetPanel:** Lists datasets, handles upload, preview, summary, and selection
- **ChatSidebar:** Large, scrollable sidebar for Q&A, only appears when a dataset is selected
- **Modern UI:** Tailwind for styling, animated transitions, responsive layout
- **JWT:** Token stored in localStorage, sent with all API requests
- **Logo:** Place your logo in `frontend/public/logo.png`

## Interview/Resume Talking Points
- Designed and built a full-stack analytics dashboard with deep AI Q&A
- Integrated OpenAI GPT and vector search (FAISS) for natural language analytics
- Used FastAPI, React, and Tailwind for a modern, robust, and joyful user experience
- Implemented secure JWT authentication and PostgreSQL integration
- Automated data chunking, embedding, and semantic search for scalable Q&A
- Built modular, well-documented codebase with best practices for error handling and environment management
- Created animated, responsive UI with a focus on usability and delight

---

## Personal Notes & Reflections
- **Why I built this:** I wanted to create a modern analytics tool that combines traditional data science with the power of LLMs for natural language Q&A, making data exploration accessible and delightful.
- **Biggest challenges:** Integrating OpenAI's new API, handling large CSVs efficiently, and ensuring the Q&A system was robust and fast for real-world data.
- **What I'm proud of:** The seamless chat sidebar, the animated and joyful UI, and the ability to ask deep questions about any dataset with instant, insightful answers.
- **What I learned:** Advanced FastAPI patterns, vector search with FAISS, embedding models, and best practices for secure, scalable full-stack apps.
- **What makes this unique:** True end-to-end integration of ML, NLP, and analytics in a single, beautiful dashboard. The Q&A is not a bolt-on, but a core part of the data workflow.
- **How I'd improve it:** Add user roles, more chart types, persistent vector storage, and real-time collaboration features.
- **How to pitch it:** "InsightIQ lets anyone upload a dataset and instantly ask deep, natural language questions—combining the best of AI, ML, and modern UX in one joyful analytics platform."

**Tip:** Review this file before interviews or resume updates to recall the stack, logic, and unique features of InsightIQ.

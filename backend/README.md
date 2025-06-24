# InsightIQ Backend

## Setup

1. Activate the virtual environment:
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   ```
2. Install dependencies (already installed if following setup):
   ```powershell
   pip install -r requirements.txt
   ```
3. Run the FastAPI server:
   ```powershell
   uvicorn main:app --reload
   ```

## Environment
- Python 3.11+
- PostgreSQL (ensure running and accessible)

---

See the main project README for more details.

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Body, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from typing import List
import pandas as pd
from io import BytesIO
import matplotlib.pyplot as plt
import base64
import numpy as np
from sklearn.linear_model import LinearRegression
from prophet import Prophet
import matplotlib
import os
from dotenv import load_dotenv
load_dotenv()
from sentence_transformers import SentenceTransformer
import faiss
import openai
from openai import OpenAI
from pydantic import BaseModel

from models import Dataset, User, Insight
from schemas import DatasetRead, DatasetPreview, InsightRead
from database import SessionLocal
from auth import verify_password

# Force Matplotlib to use the 'Agg' backend to suppress GUI warnings and ensure headless image generation.
matplotlib.use("Agg")

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(OAuth2PasswordBearer(tokenUrl="/auth/token")), db: Session = Depends(get_db)):
    # Minimal JWT decode for user id/email (expand for production)
    from jose import jwt
    from auth import SECRET_KEY, ALGORITHM
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/upload", response_model=DatasetRead)
def upload_csv(
    file: UploadFile = File(...),
    name: str = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    content = file.file.read()
    dataset_name = name if name else file.filename
    dataset = Dataset(name=dataset_name, content=content, owner_id=user.id)
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset

@router.get("/datasets", response_model=List[DatasetRead])
def list_datasets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Dataset).filter(Dataset.owner_id == user.id).order_by(Dataset.uploaded_at.desc()).all()

@router.get("/datasets/{dataset_id}/preview", response_model=DatasetPreview)
def preview_dataset(dataset_id: int, rows: int = Query(10, ge=1, le=100), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = pd.read_csv(BytesIO(dataset.content))
    preview = df.head(rows)
    return {"columns": list(preview.columns), "rows": preview.values.tolist()}

@router.get("/datasets/{dataset_id}/insights", response_model=List[InsightRead])
def list_insights(dataset_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset.insights

@router.post("/datasets/{dataset_id}/insights")
def create_insight(
    dataset_id: int,
    x: str = Body(...),
    y: str = Body(...),
    chart_type: str = Body(...),
    params: dict = Body({}, description="Optional parameters for the chart"),
    filter: dict = Body(None, description="Optional filter for date/time range"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    try:
        df = pd.read_csv(BytesIO(dataset.content))
        if x not in df.columns or y not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column {x} or {y} not found in dataset")
        # --- Filter by date/time range if provided ---
        if filter and filter.get('dateCol') and filter.get('start') and filter.get('end'):
            col = filter['dateCol']
            start = filter['start']
            end = filter['end']
            if col in df.columns:
                df = df[(df[col] >= start) & (df[col] <= end)]
        fig, ax = plt.subplots()
        # Convert x to string for line charts if it's numeric (e.g., year)
        if chart_type == 'line' and pd.api.types.is_numeric_dtype(df[x]):
            df[x] = df[x].astype(str)
        if chart_type == 'bar':
            df.plot.bar(x=x, y=y, ax=ax)
        elif chart_type == 'line':
            df.plot.line(x=x, y=y, ax=ax)
        else:
            raise HTTPException(status_code=400, detail="Unsupported chart type")
        buf = BytesIO()
        plt.savefig(buf, format='png')
        plt.close(fig)
        chart_bytes = buf.getvalue()
        summary = f"{chart_type.title()} chart of {y} vs {x}"
        import base64
        chart_b64 = base64.b64encode(chart_bytes).decode('utf-8')
        return {
            "summary": summary,
            "chart": chart_b64
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insight generation failed: {str(e)}")

@router.post("/datasets/{dataset_id}/ml_insight")
def create_ml_insight(
    dataset_id: int,
    type: str = Body(..., description="Type of ML insight: trend, forecast, regression, scatter, histogram, boxplot, etc."),
    x: str = Body(..., description="X column name"),
    y: str = Body(..., description="Y column name"),
    params: dict = Body({}, description="Optional parameters for the model/chart"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    try:
        df = pd.read_csv(BytesIO(dataset.content))
        if x not in df.columns or y not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column {x} or {y} not found in dataset")
        # --- Fix: Convert year-like columns to int for axis if possible (robust) ---
        def fix_year_axis(col):
            # If all values are floats but all are integer-valued, cast to int
            if pd.api.types.is_float_dtype(df[col]) and all(df[col].dropna().apply(lambda v: float(v).is_integer())):
                df[col] = df[col].astype(int)
            # If all values are int, leave as is
            # If all values are str and look like years, leave as is
            return df[col]
        for col in [x, y]:
            if 'year' in col.lower():
                fix_year_axis(col)
        # --- End fix ---
        fig, ax = plt.subplots()
        summary = ""
        model_info = {}
        # --- Trend (Linear Regression) ---
        if type == 'trend':
            X = df[[x]].values.reshape(-1, 1)
            y_vals = df[y].values
            reg = LinearRegression().fit(X, y_vals)
            y_pred = reg.predict(X)
            ax.scatter(df[x], y_vals, label='Data')
            ax.plot(df[x], y_pred, color='red', label='Trend')
            ax.set_title('Trend (Linear Regression)')
            ax.legend()
            summary = f"Linear regression: y = {reg.coef_[0]:.3f}x + {reg.intercept_:.3f}"
            model_info = {"coef": reg.coef_[0], "intercept": reg.intercept_}
        # --- Forecast (Prophet) ---
        elif type == 'forecast':
            periods = int(params.get('periods', 12))
            freq = params.get('freq', 'M')
            prophet_df = df[[x, y]].rename(columns={x: 'ds', y: 'y'})
            m = Prophet()
            m.fit(prophet_df)
            future = m.make_future_dataframe(periods=periods, freq=freq)
            forecast = m.predict(future)
            m.plot(forecast, ax=ax)
            ax.set_title('Forecast (Prophet)')
            summary = f"Forecast for {periods} periods using Prophet."
            model_info = {"periods": periods, "freq": freq}
        # --- Regression (Scatter + Regression Line) ---
        elif type == 'regression':
            degree = int(params.get('degree', 1))
            X = df[[x]].values.reshape(-1, 1)
            y_vals = df[y].values
            if degree == 1:
                reg = LinearRegression().fit(X, y_vals)
                y_pred = reg.predict(X)
                summary = f"Linear regression: y = {reg.coef_[0]:.3f}x + {reg.intercept_:.3f}"
                model_info = {"coef": reg.coef_[0], "intercept": reg.intercept_}
            else:
                poly = np.poly1d(np.polyfit(df[x], y_vals, degree))
                y_pred = poly(df[x])
                summary = f"Polynomial regression (deg {degree}): {poly}"
                model_info = {"poly_coeffs": poly.coefficients.tolist()}
            ax.scatter(df[x], y_vals, label='Data')
            ax.plot(df[x], y_pred, color='red', label='Regression')
            ax.set_title(f'Regression (degree {degree})')
            ax.legend()
        # --- Scatter Plot ---
        elif type == 'scatter':
            color = params.get('color', 'blue')
            ax.scatter(df[x], df[y], color=color)
            ax.set_title('Scatter Plot')
            summary = f"Scatter plot of {y} vs {x}."
            model_info = {"color": color}
        # --- Histogram ---
        elif type == 'histogram':
            bins = int(params.get('bins', 10))
            ax.hist(df[x], bins=bins)
            ax.set_title('Histogram')
            summary = f"Histogram of {x} with {bins} bins."
            model_info = {"bins": bins}
        # --- Boxplot ---
        elif type == 'boxplot':
            by = params.get('by')
            if by and by in df.columns:
                df.boxplot(column=y, by=by, ax=ax)
                summary = f"Boxplot of {y} by {by}."
                model_info = {"by": by}
            else:
                df.boxplot(column=y, ax=ax)
                summary = f"Boxplot of {y}."
                model_info = {}
        else:
            raise HTTPException(status_code=400, detail="Unsupported ML insight type")
        buf = BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png')
        plt.close(fig)
        chart_bytes = buf.getvalue()
        chart_b64 = base64.b64encode(chart_bytes).decode('utf-8')
        return {
            "chart": chart_b64,
            "model_info": model_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML insight generation failed: {str(e)}")

# --- Chart/ML Registry ---
@router.get("/charts/available")
def get_available_charts():
    """
    Returns a registry of all available chart and ML types, with their parameters and descriptions.
    """
    return [
        {
            "type": "trend",
            "label": "Trend (Linear Regression)",
            "params": [],
            "description": "Fit a linear regression to detect trend.",
        },
        {
            "type": "forecast",
            "label": "Forecast (Prophet)",
            "params": [
                {"name": "periods", "type": "int", "default": 12, "description": "Forecast periods"},
                {"name": "freq", "type": "str", "default": "M", "description": "Frequency (M=month, D=day, etc.)"}
            ],
            "description": "Forecast future values using Prophet.",
        },
        {
            "type": "regression",
            "label": "Regression (Polynomial)",
            "params": [
                {"name": "degree", "type": "int", "default": 1, "description": "Polynomial degree"}
            ],
            "description": "Fit a regression line (linear or polynomial).",
        },
        {
            "type": "scatter",
            "label": "Scatter Plot",
            "params": [
                {"name": "color", "type": "str", "default": "blue", "description": "Point color"}
            ],
            "description": "Scatter plot of two variables.",
        },
        {
            "type": "histogram",
            "label": "Histogram",
            "params": [
                {"name": "bins", "type": "int", "default": 10, "description": "Number of bins"}
            ],
            "description": "Histogram of a variable.",
        },
        {
            "type": "boxplot",
            "label": "Boxplot",
            "params": [
                {"name": "by", "type": "str", "default": None, "description": "Group by column (optional)"}
            ],
            "description": "Boxplot of a variable, optionally grouped.",
        },
        # --- Advanced ML/Analytics (stubs) ---
        {
            "type": "clustering",
            "label": "Clustering (KMeans)",
            "params": [
                {"name": "n_clusters", "type": "int", "default": 3, "description": "Number of clusters"}
            ],
            "description": "Cluster data using KMeans.",
        },
        {
            "type": "classification",
            "label": "Classification (Logistic Regression)",
            "params": [
                {"name": "target", "type": "str", "default": None, "description": "Target column"}
            ],
            "description": "Classify data using logistic regression.",
        },
        {
            "type": "anomaly",
            "label": "Anomaly Detection",
            "params": [
                {"name": "sensitivity", "type": "float", "default": 0.05, "description": "Anomaly sensitivity"}
            ],
            "description": "Detect anomalies in data.",
        },
        {
            "type": "correlation",
            "label": "Correlation Matrix",
            "params": [],
            "description": "Show correlation heatmap for all numeric columns.",
        },
        {
            "type": "profile",
            "label": "Data Profile",
            "params": [],
            "description": "Show summary statistics and missing values.",
        },
    ]

# --- Dashboard CRUD (stubs) ---
@router.post("/dashboards/")
def create_dashboard(name: str = Body(...), layout: dict = Body({}), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Create a new dashboard (stub)."""
    return {"id": 1, "name": name, "layout": layout, "insights": []}

@router.get("/dashboards/")
def list_dashboards(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """List all dashboards for the user (stub)."""
    return []

@router.get("/dashboards/{dashboard_id}")
def get_dashboard(dashboard_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get a dashboard by ID (stub)."""
    return {"id": dashboard_id, "name": "Sample Dashboard", "layout": {}, "insights": []}

@router.put("/dashboards/{dashboard_id}")
def update_dashboard(dashboard_id: int, name: str = Body(...), layout: dict = Body({}), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Update a dashboard (stub)."""
    return {"id": dashboard_id, "name": name, "layout": layout}

@router.delete("/dashboards/{dashboard_id}")
def delete_dashboard(dashboard_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Delete a dashboard (stub)."""
    return {"detail": "Dashboard deleted"}

# --- Dataset DELETE Endpoint ---
@router.delete("/datasets/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset(dataset_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    db.delete(dataset)
    db.commit()
    return

# --- Advanced ML/Analytics Stubs ---
@router.post("/datasets/{dataset_id}/ml_advanced")
def ml_advanced_stub(dataset_id: int, type: str = Body(...), params: dict = Body({}), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Stub for advanced ML/analytics (clustering, classification, anomaly, etc.)."""
    return {"detail": f"ML/analytics type '{type}' not yet implemented. Params: {params}"}

@router.get("/datasets/{dataset_id}/summary")
def dataset_summary(dataset_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = pd.read_csv(BytesIO(dataset.content))
    summary = {}
    for col in df.columns:
        col_data = df[col].dropna()
        if col_data.empty:
            continue
        stats = {}
        if pd.api.types.is_numeric_dtype(col_data):
            stats['mean'] = float(col_data.mean())
            stats['median'] = float(col_data.median())
            stats['mode'] = [v.item() if hasattr(v, 'item') else v for v in col_data.mode().values]
            stats['std'] = float(col_data.std())
            stats['min'] = float(col_data.min())
            stats['max'] = float(col_data.max())
            stats['count'] = int(col_data.count())
        else:
            stats['mode'] = [v.item() if hasattr(v, 'item') else v for v in col_data.mode().values]
            stats['count'] = int(col_data.count())
            stats['unique'] = int(col_data.nunique())
        summary[col] = stats
    return summary

# --- Deep Q&A In-memory stores (replace with DB in prod) ---
dataset_qa_chunks = {}  # dataset_id: { 'chunks': [str], 'embeddings': np.ndarray }
faiss_indexes = {}  # dataset_id: FAISS index

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 250
TOP_K = 5
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable is not set. Please set it in your .env file or system environment.")
client = OpenAI(api_key=OPENAI_API_KEY)

model = SentenceTransformer(EMBEDDING_MODEL)

# --- Deep Q&A utils ---
def chunk_dataframe(df, chunk_size=CHUNK_SIZE):
    return [df.iloc[i:i+chunk_size] for i in range(0, len(df), chunk_size)]

def summarize_chunk(chunk):
    desc = chunk.describe(include='all').to_dict()
    summary = f"Chunk rows: {len(chunk)}. "
    for col in chunk.columns:
        summary += f"{col}: "
        if pd.api.types.is_numeric_dtype(chunk[col]):
            summary += f"mean={desc[col].get('mean', 'n/a')}, min={desc[col].get('min', 'n/a')}, max={desc[col].get('max', 'n/a')}. "
        else:
            summary += f"unique={desc[col].get('unique', 'n/a')}, top={desc[col].get('top', 'n/a')}. "
    return summary

@router.post("/datasets/{dataset_id}/deepqa_prepare")
def deepqa_prepare(dataset_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == user.id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        try:
            df = pd.read_csv(BytesIO(dataset.content))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")
        chunks = chunk_dataframe(df)
        if not chunks:
            raise HTTPException(status_code=400, detail="Dataset is empty or too small to chunk.")
        chunk_texts = [summarize_chunk(chunk) for chunk in chunks]
        try:
            embeddings = model.encode(chunk_texts, show_progress_bar=True)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Embedding error: {e}")
        dim = embeddings.shape[1]
        try:
            index = faiss.IndexFlatL2(dim)
            index.add(np.array(embeddings, dtype='float32'))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"FAISS error: {e}")
        dataset_qa_chunks[dataset_id] = {'chunks': chunk_texts, 'embeddings': embeddings}
        faiss_indexes[dataset_id] = index
        return {"message": "Deep Q&A prepared", "num_chunks": len(chunk_texts)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

class AskRequest(BaseModel):
    question: str

@router.post("/datasets/{dataset_id}/ask_question")
def ask_question(dataset_id: int, req: AskRequest = Body(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        if dataset_id not in dataset_qa_chunks or dataset_id not in faiss_indexes:
            raise HTTPException(status_code=400, detail="Deep Q&A not prepared for this dataset. Call /deepqa_prepare first.")
        question_emb = model.encode([req.question])[0]
        index = faiss_indexes[dataset_id]
        D, I = index.search(np.array([question_emb], dtype='float32'), TOP_K)
        chunk_texts = dataset_qa_chunks[dataset_id]['chunks']
        selected_chunks = [chunk_texts[i] for i in I[0]]
        prompt = (
            "You are a helpful data analyst. Based on the following dataset summaries, answer the user's question as insightfully as possible.\n"
            f"Summaries:\n{chr(10).join(selected_chunks)}\n"
            f"User question: {req.question}\n"
            "Answer: "
        )
        openai.api_key = OPENAI_API_KEY
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "system", "content": "You are a helpful data analyst."},
                          {"role": "user", "content": prompt}],
                max_tokens=512,
                temperature=0.2
            )
            answer = response.choices[0].message.content.strip()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OpenAI error: {e}")
        return {"answer": answer, "context_chunks": selected_chunks}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

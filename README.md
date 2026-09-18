# LabTriage AI — Next-Gen AI Lab Report & Document RAG Platform

> **LabTriage AI** is an AI-assisted platform for parsing, prioritizing, and analyzing diagnostic laboratory reports, medical records, research papers, and complex documents. It combines hybrid Multimodal Visual Understanding, High-Precision OCR, Dense Vector Search (RAG), and a Deterministic Risk Engine to ensure high speed, transparent risk scoring, and zero clinical hallucination.

---

## 🔑 Login Credentials & Demo Accounts

All seeded demo accounts use password: `demo1234`

| Role | Name | Email | Dashboard Route |
|---|---|---|---|
| **Doctor** | Dr. Anjali Menon | `anjali.menon@labtriage.demo` | `/doctor` |
| **Doctor** | Dr. Sameer Iyer | `sameer.iyer@labtriage.demo` | `/doctor` |
| **Doctor** | Dr. Karthik Rao | `karthik.rao@labtriage.demo` | `/doctor` |
| **Doctor** | Dr. Neha Sharma | `neha.sharma@labtriage.demo` | `/doctor` |
| **Doctor** | Dr. Amit Patel | `amit.patel@labtriage.demo` | `/doctor` |
| **Lab Technician** | Meera Nair | `meera.nair@labtriage.demo` | `/lab` |
| **Lab Technician** | Vikram Das | `vikram.das@labtriage.demo` | `/lab` |
| **Lab Technician** | Rohan Verma | `rohan.verma@labtriage.demo` | `/lab` |
| **Lab Technician** | Sneha Gupta | `sneha.gupta@labtriage.demo` | `/lab` |

---

## 🛠️ Step-by-Step Instructions: How to Run the App

You can run LabTriage AI in **Offline Mode** (zero cloud API dependencies using SQLite & Local Ollama) or **Online Cloud Mode** (using Gemini Vision API & Docker Compose).

---

### 🌐 Mode A: Running Offline (Standalone / Local Mode)

Run the application entirely on your local machine without Docker or Cloud APIs.

#### 1. Setup Environment Configuration
Copy the template `.env.example` file to `.env`:
```bash
cp .env.example .env
```

#### 2. Start the Backend API (FastAPI + SQLite)
Open a terminal in the root directory:
```bash
cd backend
python -m pip install -r requirements.txt
python -m app.seed
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend API will run live at `http://127.0.0.1:8000` and automatically create/seed `labtriage_v2.db`.*

#### 3. Start Local AI Engine (Optional / Local LLM)
Download and run [Ollama](https://ollama.com/), then pull the default model:
```bash
ollama pull llama3.1
```

#### 4. Start the Frontend Web Interface
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` or `http://localhost:5174` in your browser and sign in!*

---

### ☁️ Mode B: Running Online (Docker Compose & Cloud Gemini API)

Run the multi-container infrastructure with PostgreSQL, Qdrant Vector DB, Ollama, and Gemini API.

#### 1. Configure Cloud API Key in `.env`
Edit the `.env` file in the project root and add your Gemini API Key:
```env
# Cloud AI Provider Key
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Database Settings
POSTGRES_USER=labtriage
POSTGRES_PASSWORD=labtriage_dev_password
POSTGRES_DB=labtriage
DATABASE_URL=postgresql://labtriage:labtriage_dev_password@postgres:5432/labtriage

# Vector Database
QDRANT_HOST=qdrant
QDRANT_PORT=6333
EMBEDDING_MODEL=BAAI/bge-m3
```

#### 2. Launch Docker Services
Run Docker Compose to build and launch all containers:
```bash
docker compose up --build
```
*This starts Frontend (`:5173`), Backend API (`:8000`), PostgreSQL (`:5432`), and Ollama (`:11434`).*

#### 3. Seed Demo Data inside Docker
```bash
docker compose exec backend python -m app.seed
```

#### 4. Access the Platform
Open **`http://localhost:5173`** in your browser.

---

## 📐 PDF Uploader & Document Processing Architecture

```
                PDF / PHOTO
                    │
                    ▼
          ┌──────────────────┐
          │ PyMuPDF / Pillow │
          └────────┬─────────┘
                   ▼
              PaddleOCR
                   │
                   ▼
            Extracted Text
                   │
                   ▼
              Text Chunking
                   │
                   ▼
          BGE-M3 Embeddings
                   │
                   ▼
               Qdrant
                   │
                   ▼
              RAG Retriever
                   │
                   ▼
             LLM / VLM
                   │
          ┌────────┴────────┐
          ▼                 ▼
       Summary             Q&A
```

---

## 🧠 How The Project Works

LabTriage AI provides end-to-end document ingestion, triage, and interactive retrieval workflows:

1. **Document Ingestion & OCR**:
   - PDF documents and images (scans, lab charts, medical records) are ingested using **PyMuPDF** and pre-processed with **Pillow** / **OpenCV**.
   - OCR text extraction is powered by **PaddleOCR** / **PyMuPDF**, converting visual documents into structured text.

2. **Multimodal Visual Understanding**:
   - Document figures, charts, and signatures are analyzed using Vision-Language Models (VLM) such as **Gemini Vision** or **Qwen2.5-VL / Qwen3-VL**.

3. **Dense Vector Search & RAG**:
   - Text chunks are encoded into vector space via **BGE-M3 embeddings** (using **Sentence-Transformers** / **Transformers**).
   - Indexed vectors in **Qdrant** / **FAISS** enable instant semantic retrieval.
   - **LangChain** and **LangGraph** orchestrate multi-step stateful document retrieval and Q&A.

4. **Deterministic Risk Engine (Clinical Safety)**:
   - Final risk scores (Critical, High, Medium, Normal) are strictly computed by a transparent rule engine (`backend/app/utils/risk_rules.py`), preventing AI clinical hallucinations.

---

## 🌐 RAG Multimodal Document Processing

Supported Document Types:
- 📄 **Research Paper**
- 📄 **College Notes**
- 📄 **Company Documents**
- 📷 **Scanned Documents**

```
📄 Research Paper
📄 College Notes
📄 Company Documents  ──►  RAG Retrieval Engine  ──►  Interactive Intelligence
📷 Scanned Documents
```

### Supported Prompts & Queries:
- 💡 *"Summarize this"*
- 🎯 *"Give me the important points"*
- 🧪 *"What is the methodology?"*
- 📐 *"Find all formulas"*
- ⚖️ *"Compare these two documents"*
- 🖼️ *"Explain Figure 3"*

---

## 🔄 Dual RAG Architecture Pipelines

### Pipeline 1: Cloud Multimodal (Gemini Vision / Document Model)
```
PDF / Image
   ↓
Gemini Vision / Document Model
   ↓
Text Extraction + Visual Understanding
   ↓
Embedding Model (BGE-M3 / OpenAI)
   ↓
Qdrant / FAISS Vector DB
   ↓
LLM (Gemini / Claude / GPT-4o)
   ↓
Summary & Analysis
```

### Pipeline 2: Local / Open-Source (Qwen-VL + PaddleOCR)
```
PDF / Image
   ↓
PyMuPDF + PaddleOCR
   ↓
Qwen2.5-VL / Qwen3-VL
   ↓
BGE-M3 Embeddings (Sentence-Transformers)
   ↓
FAISS / Qdrant
   ↓
Qwen LLM (PyTorch / Transformers)
   ↓
Summary + Interactive Q&A
```

---

## 🛠️ Core Technology Stack & Libraries

- **API & Backend**: `FastAPI`, `Uvicorn`, `Pydantic`, `python-dotenv`
- **RAG & Agents**: `LangChain`, `LangGraph`
- **Document & Image Processing**: `PyMuPDF`, `PaddleOCR`, `Pillow`, `OpenCV`
- **Vector Search & Embeddings**: `Sentence-Transformers`, `BGE-M3`, `Qdrant`, `FAISS`
- **Deep Learning**: `Transformers`, `PyTorch`

---

## 📂 Project Structure

```
labtriage/
├── .env.example                   # Template configuration file
├── .env                           # Local environment variables & API key
├── docker-compose.yml             # Full-stack docker services
├── README.md                      # System manual & architecture documentation
├── backend/
│   ├── app/
│   │   ├── api/                   # API routers (auth, reports, dashboard, etc.)
│   │   ├── core/                  # Security (JWT & bcrypt), Database config
│   │   ├── models/                # SQLAlchemy models (__init__.py, user, report, etc.)
│   │   ├── schemas/               # Pydantic schemas
│   │   ├── services/              # OCR, AI, Triage, Report orchestration
│   │   ├── utils/risk_rules.py    # Deterministic scoring engine
│   │   ├── main.py                # FastAPI entrypoint
│   │   └── seed.py                # Database seeding script
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/            # UI components
    │   ├── pages/                 # Login, Dashboards, Upload, Analytics
    │   └── services/api.ts        # API integration layer
    └── vite.config.ts
```

---

## ⚠️ Medical Disclaimer

> **Notice**: LabTriage AI is a prototype designed for diagnostic lab report workflow optimization and document intelligence. It is intended to assist medical professionals and does not replace official clinical diagnoses.

# How to Run LabTriage AI — Complete Setup & Quick Start Guide

This guide provides clear, step-by-step instructions to get **LabTriage AI** up and running on your local machine.

---

> ⚠️ **Important Note on Terminal Directory Paths**
> 
> The project root contains two main subfolders:
> - **`backend/`** (FastAPI Python backend)
> - **`frontend/`** (Vite + React frontend)
> 
> Commands like `npm install` or `npm run dev` **must be executed inside the `frontend` folder**, NOT in the root directory.

---

## 🔑 Demo Accounts & Login Credentials

All seeded demo accounts use the password: **`demo1234`**

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

## ⚡ Option 1: Running Locally (Recommended / Fast Setup)

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**

---

### Step 1: Start the Backend Server

Open your terminal in the project root directory:

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
python -m pip install -r requirements.txt

# Run database seed script (Seeds doctors, lab technicians & demo reports)
python -m app.seed

# Start the FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

> **Backend URL:** `http://127.0.0.1:8000`  
> *(The database file `labtriage_v2.db` is generated automatically)*

---

### Step 2: Start the Frontend Application

Open a **second terminal window** in the project root directory:

```bash
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start Vite development server
npm run dev
```

> **Frontend URL:** `http://localhost:5173`

Open `http://localhost:5173` in your browser and sign in using any demo account above.

---

## 🐳 Option 2: Running with Docker Compose

If you have Docker Desktop installed, you can launch the complete containerized stack (PostgreSQL + FastAPI + Vite Frontend + Ollama).

### Step 1: Launch Containers

In the project root directory:

```bash
# Build and start all services
docker compose up --build
```

### Step 2: Seed Data in Container

In a separate terminal window:

```bash
docker compose exec backend python -m app.seed
```

### Step 3: Access Application

Open **`http://localhost:5173`** in your browser.

---

## ✨ Features Implemented & How to Test

1. **6-Character Unique Patient IDs**:
   - Every patient entry is automatically assigned a 6-character unique ID (e.g. `#P8X92A`).
   - Visible in the **Lab Technician History** table.

2. **Risk Redaction for Lab Technicians**:
   - When logged in as a **Lab Technician**, risk levels, risk scores, and clinical recommendations are hidden.
   - Lab Technicians see report upload statuses and auto-allocated doctor details.

3. **Automated Doctor Allocation & Direct Notification**:
   - Uploading a patient lab report automatically allocates an available doctor (least-loaded algorithm).
   - The allocated doctor receives an immediate notification in their top-bar notification center (`Bell` icon).
   - Logging in as the assigned doctor allows full review of patient risk scores, lab findings, and AI clinical summaries.
1. 🔒 Data Privacy, Security & Compliance
Audit Trail & Access Logging: Log every instance when a patient record or PDF document is accessed, downloaded, or updated (essential for HIPAA/GDPR compliance).
Time-Limited Access Tokens: Implement automatic session timeouts and single-use link generation for viewing sensitive PDF documents.
Role-Based Access Control (RBAC) Expansion: Add dedicated roles such as Department Head, Radiologist/Consultant, and Compliance Auditor with custom access scopes.
2. 📊 Advanced AI Analysis & Clinical Intelligence
Longitudinal Trend Graphing: Plot historical lab test values (e.g., Hemoglobin, Creatinine, WBC) over time across multiple visits so doctors can visually track patient progression.
Side-by-Side Report Comparison: Enable doctors to view current lab results side-by-side with previous historical reports for the same patient.
OCR Extraction Confidence Scores: Highlight extracted values with confidence indicators (High/Medium/Low) to alert doctors if a scan was blurry or handwritten.
Custom Triage Rule Configurator: Allow hospital administrators to customize reference range thresholds and risk formulas tailored to specific hospital departments.
3. 🔔 Real-Time Communication & Alerts
SMS & Email Emergency Notifications: Trigger instant SMS (Twilio) or Email alerts to attending doctors whenever a CRITICAL priority report is uploaded.
In-App Doctor-Technician Messaging: Allow doctors to request test re-runs, request clearer document scans, or add notes directly for the lab technician within the report detail view.
Specialist Consultation Routing: Enable primary attending doctors to forward a report to specialized consultants (e.g., Hematologist, Nephrologist) with one click for a second opinion.
4. 🚀 Workflow & EHR Integration
HL7 / FHIR Standard Export: Export patient data and triage findings in standard FHIR JSON format for seamless integration with Electronic Health Record (EHR) systems like Epic or Cerner.
Batch Uploading: Allow lab technicians to drag-and-drop multiple lab report files or ZIP archives at once for batch AI extraction and allocation.
Exportable PDF Clinical Reports: Generate downloadable, formatted summary PDFs including doctor review signatures and timestamps for hospital archives.
5. 📈 Operational Analytics & SLAs
Turnaround Time (TAT) Analytics: Track turnaround metrics from initial lab upload to doctor review completion to measure hospital operational efficiency.
Workload & Allocation Heatmaps: Provide hospital management with visual dashboards showing peak upload hours, review bottlenecks, and doctor workloads.
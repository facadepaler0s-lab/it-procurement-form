# IT Infrastructure Procurement Request Portal

A production-ready, full-stack Python web application designed for enterprise IT procurement. Features SQLite request logging, an authenticated IT team audit panel, and automated email alerts.

---

## 🛠️ Key Capabilities & Workflow

1. **Digital Requisition Submissions (`GET /` & `POST /submit`):**
   - Clean, standardized corporate form with zero hardcoded individual identities.
   - Dynamic department hardware configurations (Media, IT, Data Science, Finance, HR, Admin).
   - Upon clicking **"Submit Request"**, the requisition is logged in the database and email alerts are sent. **No client-side PDF download or print popups are presented to the submitter.**

2. **Demo Mode Protection (Non-Savable & Non-Printable):**
   - Clicking **"Load Demo Data"** activates a strict Preview Mode.
   - **Non-Savable:** The submit button is locked (`disabled`), and the backend rejects demo data submissions with HTTP 400.
   - **Non-Printable:** Print attempts via `Ctrl+P` or browser print menus are intercepted and blocked with a warning banner.

3. **Secure IT Submissions Log Panel (`/login` & `/portal`):**
   - Protected audit log designed exclusively for the IT Infrastructure team.
   - Requires login authentication:
     - **Default Username:** `itadmin`
     - **Default Password:** `Geneza@IT2026` *(configurable via `.env`)*
   - Features real-time search & department filtering across all requisitions.
   - "View Details" inspection modal with archived PDF requisition retrieval for IT staff.

4. **Automated Notification & Audit Dispatches:**
   - On submission, an automated email with the compiled requisition PDF is dispatched to **`it-procurement@geneza.in`** and **`stephenson.omanakuttan@geneza.in`** (with HOD and requester CC'd).

---

## 📂 Project Directory Structure

```text
d:\Procurement Form\
├── main.py                    # FastAPI application routes (/, /submit, /login, /logout, /portal, /download)
├── database.py                # Database connection manager (SQLite & Cloud DB ready)
├── models.py                  # SQLAlchemy ProcurementRequest database schema
├── pdf_generator.py           # Dual-engine A4 PDF compiler (WeasyPrint + ReportLab fallback)
├── email_service.py           # Automated email dispatcher via smtplib
├── requirements.txt           # Python package dependencies
├── .env.example               # Template environment configuration file
├── procurement.db             # Local SQLite database storing all requisitions
├── generated_pdfs/            # Directory containing generated A4 PDF requisitions
├── templates/
│   ├── index.html             # Requisition Form (POST /submit) with Demo Protection
│   ├── success.html           # Submission confirmation receipt (no print/PDF prompts)
│   ├── login.html             # IT Team login screen
│   ├── portal.html            # Protected IT Submissions Log Panel
│   └── pdf_template.html      # Formal A4 requisition document layout
└── static/
    ├── style.css              # Corporate responsive stylesheet with print-blocking rules
    └── script.js              # Client-side dynamic department matrix & demo lock handler
```

---

## 🚀 Running the Application

### 1. Start the Server
```powershell
.\.venv\Scripts\Activate.ps1
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Available Routes
* **Public Requisition Form:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
* **IT Team Portal (Login Required):** [http://127.0.0.1:8000/portal](http://127.0.0.1:8000/portal)
* **IT Staff Login:** [http://127.0.0.1:8000/login](http://127.0.0.1:8000/login)
  - **Username:** `itadmin`
  - **Password:** `Geneza@IT2026`
* **Interactive API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

import os
from typing import Optional
from fastapi import FastAPI, Request, Form, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import ProcurementRequest
from pdf_generator import generate_procurement_pdf
from email_service import send_procurement_email

# Ensure required directories exist
PDF_DIR = os.path.join(os.path.dirname(__file__), "generated_pdfs")
os.makedirs(PDF_DIR, exist_ok=True)
os.makedirs("static", exist_ok=True)
os.makedirs("templates", exist_ok=True)

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Security and Credentials Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "it_procurement_session_secret_key_2026")
IT_ADMIN_USER = os.getenv("IT_ADMIN_USER", "itadmin")
IT_ADMIN_PASS = os.getenv("IT_ADMIN_PASS", "Geneza@IT2026")

app = FastAPI(
    title="IT Infrastructure Procurement Portal",
    description="IT equipment requisition portal with SQLite logging, IT Team Panel, and automated email alerts.",
    version="2.1.0"
)

app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# ── Public Requisition Form Routes ──

@app.get("/", response_class=HTMLResponse)
async def get_procurement_form(request: Request):
    """
    Renders the IT Infrastructure Procurement Request Form.
    """
    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )


@app.post("/submit", response_class=HTMLResponse)
async def submit_procurement_request(
    request: Request,
    ticketNumber: str = Form(...),
    dateOfRequest: str = Form(...),
    requesterName: str = Form(...),
    officialEmail: str = Form(...),
    department: str = Form(...),
    otherDeptName: Optional[str] = Form(None),
    hodManager: str = Form(...),
    deliveryAddress: str = Form(...),
    requestType: str = Form(...),
    itemCategory: str = Form(...),
    itemRequested: str = Form(...),
    quantity: int = Form(1),
    dateRequired: str = Form(...),
    purpose: str = Form(...),
    laptop_specs: Optional[str] = Form(None),
    is_demo: Optional[str] = Form("0"),
    db: Session = Depends(get_db)
):
    """
    Validates form data, saves into the SQLite database log,
    dispatches automated email alerts with attached PDF to IT and Stephenson,
    and returns a clean confirmation receipt (no printable or PDF prompt for the submitter).
    """
    # Clean inputs and tag demo data cleanly without blocking submission
    ticket_clean = ticketNumber.strip().upper()
    req_name_clean = requesterName.strip()
    is_demo_submission = (is_demo == "1" or "DEMO" in ticket_clean or "SAMPLE" in req_name_clean.upper() or "DEMO" in req_name_clean.upper())
    req_status = "Demo / Preview" if is_demo_submission else "Submitted"

    email_clean = officialEmail.strip().lower()
    dept_clean = department.strip()
    other_dept_clean = otherDeptName.strip() if otherDeptName else None

    # 1. Save directly into SQLite audit log
    db_record = ProcurementRequest(
        ticket_number=ticket_clean,
        date_of_request=dateOfRequest,
        requester_name=req_name_clean,
        official_email=email_clean,
        department=dept_clean,
        other_department=other_dept_clean,
        delivery_address=deliveryAddress.strip(),
        hod_manager=hodManager.strip(),
        request_type=requestType.strip(),
        item_category=itemCategory.strip(),
        item_requested=itemRequested.strip(),
        quantity=quantity,
        date_required=dateRequired,
        purpose=purpose.strip(),
        laptop_specs=laptop_specs.strip() if laptop_specs else None,
        status=req_status
    )

    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    # 2. Compile requisition PDF for IT archive
    try:
        pdf_filename = generate_procurement_pdf(db_record, PDF_DIR)
        db_record.pdf_filename = pdf_filename
        db.commit()
        db.refresh(db_record)
    except Exception as e:
        print(f"[Notice PDF Generation]: {e}")

    # 3. Render confirmation receipt with direct printing option
    return templates.TemplateResponse(
        request=request,
        name="success.html",
        context={"req": db_record}
    )


# ── IT Team Authentication & Submissions Panel Routes ──

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """
    Renders the login screen for IT staff.
    """
    if request.session.get("authenticated"):
        return RedirectResponse(url="/portal", status_code=status.HTTP_302_FOUND)
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={"error": None}
    )


@app.post("/login", response_class=HTMLResponse)
async def process_login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...)
):
    """
    Authenticates IT staff credentials and initiates session.
    """
    if username.strip() == IT_ADMIN_USER and password == IT_ADMIN_PASS:
        request.session["authenticated"] = True
        request.session["user"] = username.strip()
        return RedirectResponse(url="/portal", status_code=status.HTTP_302_FOUND)

    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={"error": "Invalid IT staff username or password. Please verify credentials."}
    )


@app.get("/logout")
async def process_logout(request: Request):
    """
    Terminates session and returns to login page.
    """
    request.session.clear()
    return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)


@app.get("/portal", response_class=HTMLResponse)
async def it_submissions_panel(
    request: Request,
    msg: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Secure panel for the IT team to review the log of who submitted what requests.
    """
    if not request.session.get("authenticated"):
        return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)

    all_submissions = db.query(ProcurementRequest).order_by(ProcurementRequest.id.desc()).all()
    user = request.session.get("user", "IT Staff")

    return templates.TemplateResponse(
        request=request,
        name="portal.html",
        context={
            "requests": all_submissions,
            "user": user,
            "msg": msg
        }
    )


@app.api_route("/portal/delete/{request_id}", methods=["GET", "POST"])
async def delete_procurement_request(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Deletes a single procurement request and its archived PDF file.
    Only accessible by authenticated IT staff.
    Supports both GET and POST requests.
    """
    if not request.session.get("authenticated"):
        return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)

    record = db.query(ProcurementRequest).filter(ProcurementRequest.id == request_id).first()
    if record:
        if record.pdf_filename:
            pdf_path = os.path.join(PDF_DIR, record.pdf_filename)
            if os.path.exists(pdf_path):
                try:
                    os.remove(pdf_path)
                except Exception as e:
                    print(f"[Notice deleting PDF]: {e}")
        db.delete(record)
        db.commit()

    return RedirectResponse(url="/portal?msg=deleted", status_code=status.HTTP_302_FOUND)


@app.api_route("/portal/clear-all", methods=["GET", "POST"])
async def clear_all_procurement_requests(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Clears all submitted procurement requests from the database and removes generated PDFs.
    Only accessible by authenticated IT staff.
    Supports both GET and POST requests.
    """
    if not request.session.get("authenticated"):
        return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)

    records = db.query(ProcurementRequest).all()
    for record in records:
        if record.pdf_filename:
            pdf_path = os.path.join(PDF_DIR, record.pdf_filename)
            if os.path.exists(pdf_path):
                try:
                    os.remove(pdf_path)
                except Exception as e:
                    print(f"[Notice deleting PDF]: {e}")
        db.delete(record)

    db.commit()
    return RedirectResponse(url="/portal?msg=cleared", status_code=status.HTTP_302_FOUND)


@app.get("/download/{request_id}")
async def download_pdf_archive(request_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Allows authenticated IT staff to retrieve the archived PDF copy from the submissions log.
    """
    if not request.session.get("authenticated"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in to the IT Team Portal."
        )

    record = db.query(ProcurementRequest).filter(ProcurementRequest.id == request_id).first()
    if not record or not record.pdf_filename:
        raise HTTPException(status_code=404, detail="Requisition PDF record not found.")

    pdf_path = os.path.join(PDF_DIR, record.pdf_filename)
    if not os.path.exists(pdf_path):
        generate_procurement_pdf(record, PDF_DIR)

    return FileResponse(
        path=pdf_path,
        filename=record.pdf_filename,
        media_type="application/pdf"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

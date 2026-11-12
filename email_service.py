import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.geneza.in")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "procurement-bot@geneza.in")
SMTP_PASS = os.getenv("SMTP_PASS", "placeholder_password")
SMTP_FROM = os.getenv("SMTP_FROM", "procurement-portal@geneza.in")

DEFAULT_IT_EMAIL = os.getenv("IT_PROCUREMENT_EMAIL", "it-procurement@geneza.in")
MANDATORY_COPY_EMAIL = os.getenv("AUDIT_COPY_EMAIL", "stephenson.omanakuttan@geneza.in")
COMPANY_NAME = os.getenv("COMPANY_NAME", "Geneza Technologies")

def send_procurement_email(req, pdf_path: str = None) -> bool:
    """
    Sends an automated notification email with the generated PDF attached
    to IT Procurement and the designated audit recipient, CC'ing the requester & HOD.
    """
    to_recipients = [DEFAULT_IT_EMAIL]
    if MANDATORY_COPY_EMAIL and MANDATORY_COPY_EMAIL not in to_recipients:
        to_recipients.append(MANDATORY_COPY_EMAIL)

    cc_list = []
    if req.official_email:
        cc_list.append(req.official_email)

    # Format manager email guess based on requester's domain
    if req.hod_manager and "@" in req.official_email:
        domain = req.official_email.split("@")[1]
        hod_clean = req.hod_manager.lower().replace(" ", ".").split("(")[0].strip()
        if hod_clean:
            hod_email_guess = f"{hod_clean}@{domain}"
            if hod_email_guess not in cc_list and hod_email_guess not in to_recipients:
                cc_list.append(hod_email_guess)

    msg = MIMEMultipart()
    msg['From'] = SMTP_FROM
    msg['To'] = ", ".join(to_recipients)
    if cc_list:
        msg['Cc'] = ", ".join(cc_list)
    msg['Subject'] = f"[Procurement Request] {req.ticket_number} - {req.item_requested} ({req.department})"

    dept_display = req.department
    if req.other_department:
        dept_display += f" ({req.other_department})"

    body = f"""Dear IT Infrastructure & Procurement Team,

A new IT Procurement Requisition has been submitted through the portal and logged in the database.

=======================================================
REQUISITION SUMMARY
=======================================================
Ticket Number   : {req.ticket_number}
Date of Request : {req.date_of_request}
Requester Name  : {req.requester_name}
Official Email  : {req.official_email}
Department      : {dept_display}
Reporting HOD   : {req.hod_manager}
Delivery Address: {req.delivery_address}

ITEM SPECIFICATIONS
-------------------------------------------------------
Request Type    : {req.request_type}
Item Category   : {req.item_category}
Item Requested  : {req.item_requested}
Quantity        : {req.quantity}
Date Required   : {req.date_required}
Purpose / Work  :
{req.purpose}

{f"Hardware Spec  : {req.laptop_specs}" if req.laptop_specs else ""}
Database Record : ID #{req.id} (Status: {req.status})
=======================================================

The official requisition PDF has been compiled and is attached to this email for sign-off and ticketing attachment.

Copy sent to:
- IT Procurement: {DEFAULT_IT_EMAIL}
- Audit Copy: {MANDATORY_COPY_EMAIL}
- Requester: {req.official_email}
- Manager / HOD: {req.hod_manager}

Regards,
IT Procurement Automation System
{COMPANY_NAME}
"""

    msg.attach(MIMEText(body, 'plain'))

    # Attach PDF if generated
    if pdf_path and os.path.exists(pdf_path):
        try:
            with open(pdf_path, 'rb') as f:
                part = MIMEBase('application', 'pdf')
                part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename="{os.path.basename(pdf_path)}"'
            )
            msg.attach(part)
        except Exception as err:
            print(f"[Email Service] Error attaching PDF: {err}")

    # Dispatch via SMTP (with safe logging when credentials are placeholders)
    all_recipients = list(dict.fromkeys(to_recipients + cc_list))
    try:
        if SMTP_HOST == "smtp.geneza.in" and SMTP_PASS == "placeholder_password":
            print(f"[Email Service (Demo Mode)] Automated email prepared and logged:")
            print(f"  To: {', '.join(to_recipients)}")
            print(f"  Cc: {', '.join(cc_list)}")
            print(f"  Subject: {msg['Subject']}")
            if pdf_path:
                print(f"  Attached: {os.path.basename(pdf_path)}")
            return True

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_FROM, all_recipients, msg.as_string())
        server.quit()
        print(f"[Email Service] Email successfully sent for {req.ticket_number} to {', '.join(all_recipients)}")
        return True
    except Exception as err:
        print(f"[Email Service Notice] Could not connect to real SMTP server ({err}). Email payload logged.")
        return False

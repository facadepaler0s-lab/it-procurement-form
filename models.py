from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base

class ProcurementRequest(Base):
    __tablename__ = "procurement_requests"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(50), index=True, nullable=False)
    date_of_request = Column(String(20), nullable=False)
    requester_name = Column(String(100), nullable=False)
    official_email = Column(String(120), nullable=False)
    department = Column(String(100), nullable=False)
    other_department = Column(String(100), nullable=True)
    delivery_address = Column(String(255), nullable=False)
    hod_manager = Column(String(100), nullable=False)

    request_type = Column(String(50), nullable=False)
    item_category = Column(String(100), nullable=False)
    item_requested = Column(String(200), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    date_required = Column(String(20), nullable=False)
    purpose = Column(Text, nullable=False)

    laptop_specs = Column(Text, nullable=True)
    status = Column(String(30), default="Submitted", nullable=False)
    pdf_filename = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def hod_name(self):
        return self.hod_manager

    @property
    def requester_email(self):
        return self.official_email

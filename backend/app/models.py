from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, JSON
from sqlalchemy.sql import func
from app.database import Base


class KitchenOrder(Base):
    __tablename__ = "kitchen_orders"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(10), nullable=False)
    items = Column(JSON, nullable=False)
    total = Column(Float, nullable=False, default=0.0)
    status = Column(String(20), default="pending")
    session_id = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class HousekeepingRequest(Base):
    __tablename__ = "housekeeping_queue"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(10), nullable=False)
    request = Column(Text, nullable=False)
    priority = Column(String(10), nullable=False, default="normal")
    status = Column(String(20), default="pending")
    session_id = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RestaurantBooking(Base):
    __tablename__ = "restaurant_bookings"

    id = Column(Integer, primary_key=True, index=True)
    guest_name = Column(String(100), nullable=False)
    room_number = Column(String(10), nullable=False)
    date = Column(String(20), nullable=False)
    time_slot = Column(String(20), nullable=False)
    party_size = Column(Integer, nullable=False)
    status = Column(String(20), default="confirmed")
    session_id = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(10), nullable=False)
    complaint = Column(Text, nullable=False)
    original_message = Column(Text, nullable=False)
    manager_escalated = Column(Boolean, default=False)
    status = Column(String(20), default="open")
    session_id = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RecommendationLog(Base):
    __tablename__ = "recommendations_log"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(10), nullable=True)
    query = Column(Text, nullable=False)
    recommendations = Column(JSON, nullable=False)
    session_id = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "guest" or "assistant"
    message = Column(Text, nullable=False)
    category = Column(String(200), nullable=True)
    room_number = Column(String(10), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

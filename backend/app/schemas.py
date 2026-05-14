import re
import html
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class ChatRequest(BaseModel):
    message: str
    session_id: str
    room_number: Optional[str] = None

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty")
        if len(v) > 2000:
            raise ValueError("Message too long (max 2000 characters)")
        # Sanitize HTML to prevent XSS
        v = html.escape(v)
        return v

    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 120:
            raise ValueError("Invalid session ID")
        if not re.match(r'^[a-zA-Z0-9_\-]+$', v):
            raise ValueError("Session ID contains invalid characters")
        return v

    @field_validator("room_number")
    @classmethod
    def validate_room_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if not v:
            return None
        if len(v) > 10:
            raise ValueError("Room number too long")
        return v


class ChatResponse(BaseModel):
    reply: str
    actions: list = []
    session_id: str


class KitchenOrderOut(BaseModel):
    id: int
    room_number: str
    items: list
    total: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class HousekeepingOut(BaseModel):
    id: int
    room_number: str
    request: str
    priority: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class RestaurantBookingOut(BaseModel):
    id: int
    guest_name: str
    room_number: str
    date: str
    time_slot: str
    party_size: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ComplaintOut(BaseModel):
    id: int
    room_number: str
    complaint: str
    original_message: str
    manager_escalated: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class RecommendationOut(BaseModel):
    id: int
    room_number: Optional[str]
    query: str
    recommendations: list
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: int
    session_id: str
    role: str
    message: str
    category: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

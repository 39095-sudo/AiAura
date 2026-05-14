from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import (
    KitchenOrder, HousekeepingRequest, RestaurantBooking,
    Complaint, RecommendationLog
)
from app.schemas import (
    KitchenOrderOut, HousekeepingOut, RestaurantBookingOut,
    ComplaintOut, RecommendationOut
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kitchen-orders", response_model=list[KitchenOrderOut])
async def get_kitchen_orders(db: Session = Depends(get_db)):
    return db.query(KitchenOrder).order_by(desc(KitchenOrder.created_at)).limit(50).all()


@router.get("/housekeeping", response_model=list[HousekeepingOut])
async def get_housekeeping(db: Session = Depends(get_db)):
    return db.query(HousekeepingRequest).order_by(desc(HousekeepingRequest.created_at)).limit(50).all()


@router.get("/restaurant-bookings", response_model=list[RestaurantBookingOut])
async def get_restaurant_bookings(db: Session = Depends(get_db)):
    return db.query(RestaurantBooking).order_by(desc(RestaurantBooking.created_at)).limit(50).all()


@router.get("/complaints", response_model=list[ComplaintOut])
async def get_complaints(db: Session = Depends(get_db)):
    return db.query(Complaint).order_by(desc(Complaint.created_at)).limit(50).all()


@router.get("/recommendations", response_model=list[RecommendationOut])
async def get_recommendations(db: Session = Depends(get_db)):
    return db.query(RecommendationLog).order_by(desc(RecommendationLog.created_at)).limit(50).all()


class StatusUpdate(BaseModel):
    status: str


MODEL_MAP = {
    "kitchen-orders": KitchenOrder,
    "housekeeping": HousekeepingRequest,
    "restaurant-bookings": RestaurantBooking,
    "complaints": Complaint,
}

VALID_STATUSES = {
    "kitchen-orders": ["pending", "preparing", "completed"],
    "housekeeping": ["pending", "in_progress", "completed"],
    "restaurant-bookings": ["confirmed", "completed", "cancelled"],
    "complaints": ["open", "in_progress", "resolved"],
}


@router.patch("/{queue}/{item_id}")
async def update_status(queue: str, item_id: int, body: StatusUpdate, db: Session = Depends(get_db)):
    model = MODEL_MAP.get(queue)
    if not model:
        raise HTTPException(status_code=404, detail="Queue not found")
    valid = VALID_STATUSES.get(queue, [])
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid}")
    record = db.query(model).filter(model.id == item_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    record.status = body.status
    db.commit()
    return {"id": item_id, "status": body.status}


@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    return {
        "kitchen_orders": db.query(KitchenOrder).count(),
        "housekeeping": db.query(HousekeepingRequest).count(),
        "restaurant_bookings": db.query(RestaurantBooking).count(),
        "complaints": db.query(Complaint).count(),
        "recommendations": db.query(RecommendationLog).count(),
        "pending_kitchen": db.query(KitchenOrder).filter(KitchenOrder.status == "pending").count(),
        "pending_housekeeping": db.query(HousekeepingRequest).filter(HousekeepingRequest.status == "pending").count(),
        "open_complaints": db.query(Complaint).filter(Complaint.status == "open").count(),
        "escalated_complaints": db.query(Complaint).filter(Complaint.manager_escalated == True).count(),
    }

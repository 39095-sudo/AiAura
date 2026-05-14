from sqlalchemy.orm import Session
from app.models import (
    KitchenOrder, HousekeepingRequest, RestaurantBooking,
    Complaint, RecommendationLog
)
from app.mock_data import RESTAURANT_SLOTS, ROOM_SERVICE_MENU, LOCAL_RECOMMENDATIONS
from datetime import date, timedelta


def process_room_service(db: Session, data: dict, room_number: str, session_id: str) -> dict:
    """Process a room service order and save to kitchen_orders."""
    items = data.get("items", [])
    if not items:
        return {"success": False, "message": "No items specified for room service."}

    processed_items = []
    total = 0.0
    for item in items:
        name = item.get("name", "").lower().strip()
        # Try to match with menu, use provided price as fallback
        price = ROOM_SERVICE_MENU.get(name, item.get("price", 15.00))
        processed_items.append({"name": name, "price": price})
        total += price

    order = KitchenOrder(
        room_number=room_number,
        items=processed_items,
        total=round(total, 2),
        status="pending",
        session_id=session_id,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {"success": True, "order_id": order.id, "total": order.total}


def process_housekeeping(db: Session, data: dict, room_number: str, session_id: str) -> dict:
    """Process a housekeeping request and save to housekeeping_queue."""
    request_text = data.get("request", "General housekeeping request")
    priority = data.get("priority", "normal")
    if priority not in ("urgent", "normal"):
        priority = "normal"

    req = HousekeepingRequest(
        room_number=room_number,
        request=request_text,
        priority=priority,
        status="pending",
        session_id=session_id,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    return {"success": True, "request_id": req.id, "priority": priority}


def process_restaurant_booking(
    db: Session, data: dict, room_number: str, session_id: str
) -> dict:
    """Check availability and book a restaurant table."""
    time_slot = data.get("time_slot", "7:00 PM")
    party_size = data.get("party_size", 2)
    guest_name = data.get("guest_name", "Guest")
    raw_date = data.get("date", "")
    if not raw_date or raw_date.lower() == "today":
        booking_date = str(date.today())
    elif raw_date.lower() == "tomorrow":
        booking_date = str(date.today() + timedelta(days=1))
    else:
        booking_date = raw_date

    if time_slot not in RESTAURANT_SLOTS:
        available = ", ".join(RESTAURANT_SLOTS.keys())
        return {
            "success": False,
            "message": f"That time slot is not available. Available slots: {available}",
        }

    slot_info = RESTAURANT_SLOTS[time_slot]
    existing_bookings = (
        db.query(RestaurantBooking)
        .filter(
            RestaurantBooking.time_slot == time_slot,
            RestaurantBooking.date == booking_date,
            RestaurantBooking.status == "confirmed",
        )
        .all()
    )

    total_booked = sum(b.party_size for b in existing_bookings)
    if total_booked + party_size > slot_info["capacity"]:
        return {
            "success": False,
            "message": f"Sorry, the {time_slot} slot is fully booked for {booking_date}. "
                       f"Please try another time.",
        }

    booking = RestaurantBooking(
        guest_name=guest_name,
        room_number=room_number,
        date=booking_date,
        time_slot=time_slot,
        party_size=party_size,
        status="confirmed",
        session_id=session_id,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return {
        "success": True,
        "booking_id": booking.id,
        "time_slot": time_slot,
        "party_size": party_size,
        "date": booking_date,
    }


def process_complaint(db: Session, data: dict, room_number: str, session_id: str, original_message: str) -> dict:
    """Log a complaint and escalate to manager if needed."""
    complaint_text = data.get("complaint", original_message)
    manager_escalated = data.get("manager_escalated", False)

    comp = Complaint(
        room_number=room_number,
        complaint=complaint_text,
        original_message=original_message,
        manager_escalated=manager_escalated,
        status="open",
        session_id=session_id,
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)

    return {
        "success": True,
        "complaint_id": comp.id,
        "manager_escalated": manager_escalated,
    }


def process_recommendations(db: Session, data: dict, room_number: str, session_id: str) -> dict:
    """Provide local recommendations and log them."""
    query = data.get("query", "general recommendations")
    rec_type = data.get("type", "attractions").lower()

    # Pick the best matching category
    category_map = {
        "restaurant": "restaurants", "food": "restaurants", "eat": "restaurants",
        "dining": "restaurants", "attraction": "attractions", "visit": "attractions",
        "see": "attractions", "sightseeing": "attractions", "tour": "attractions",
        "shop": "shopping", "buy": "shopping", "market": "shopping",
        "mall": "shopping", "night": "nightlife", "bar": "nightlife",
        "club": "nightlife", "drink": "nightlife", "party": "nightlife",
    }

    matched_category = "attractions"
    for keyword, cat in category_map.items():
        if keyword in rec_type or keyword in query.lower():
            matched_category = cat
            break

    recs = LOCAL_RECOMMENDATIONS.get(matched_category, LOCAL_RECOMMENDATIONS["attractions"])
    selected = recs[:3]

    log = RecommendationLog(
        room_number=room_number,
        query=query,
        recommendations=selected,
        session_id=session_id,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return {"success": True, "recommendations": selected, "log_id": log.id}

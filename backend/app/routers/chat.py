import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ChatRequest, ChatResponse
from app.models import Conversation, RestaurantBooking

logger = logging.getLogger(__name__)
from app.services.ai_router import classify_request
from app.services.workflows import (
    process_room_service,
    process_housekeeping,
    process_restaurant_booking,
    process_complaint,
    process_recommendations,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])

WORKFLOW_MAP = {
    "room_service": process_room_service,
    "housekeeping": process_housekeeping,
    "restaurant_booking": process_restaurant_booking,
    "local_recommendations": process_recommendations,
}

NEEDS_ROOM = {"room_service", "housekeeping", "restaurant_booking", "complaint"}


def _get_session_room(db: Session, session_id: str) -> str | None:
    """Look up the most recent room number stored for a session in the DB."""
    row = (
        db.query(Conversation.room_number)
        .filter(
            Conversation.session_id == session_id,
            Conversation.room_number.isnot(None),
        )
        .order_by(Conversation.created_at.desc())
        .first()
    )
    return row.room_number if row else None


def _save_session_room(db: Session, session_id: str, room_number: str) -> None:
    """Stamp the room number on the most recent conversation row for this session."""
    latest = (
        db.query(Conversation)
        .filter(Conversation.session_id == session_id)
        .order_by(Conversation.created_at.desc())
        .first()
    )
    if latest:
        latest.room_number = room_number
        db.commit()


@router.post("/send", response_model=ChatResponse)
async def send_message(req: ChatRequest, db: Session = Depends(get_db)):
    guest_msg = Conversation(
        session_id=req.session_id,
        role="guest",
        message=req.message,
    )
    db.add(guest_msg)
    db.commit()

    # Get conversation history
    history = (
        db.query(Conversation)
        .filter(Conversation.session_id == req.session_id)
        .order_by(Conversation.created_at.asc())
        .all()
    )
    history_dicts = [{"role": h.role, "message": h.message} for h in history]

    # Resolve room number: request param > DB history
    room_number = req.room_number or _get_session_room(db, req.session_id)

    # Classify with AI
    result = await classify_request(req.message, history_dicts, room_number)

    # Check if AI extracted a room number from the chat
    ai_room = result.get("room_number")
    if ai_room and ai_room != "null" and str(ai_room).strip():
        room_number = str(ai_room).strip()
        _save_session_room(db, req.session_id, room_number)

    # If we got a room number from request, persist it
    if req.room_number:
        _save_session_room(db, req.session_id, req.room_number)

    actions = result.get("actions", [])
    reply = result.get("reply", "I'm sorry, could you please repeat that?")
    processed_actions = []

    for action in actions:
        category = action.get("category", "clarification")
        needs_room = action.get("needs_room_number", False)
        data = action.get("data", {})

        if category == "clarification":
            processed_actions.append({"category": "clarification", "status": "asked"})
            continue

        # If room needed but missing, let AI's reply (asking for room) stand
        if (needs_room or category in NEEDS_ROOM) and not room_number:
            processed_actions.append({
                "category": category,
                "status": "needs_room_number",
            })
            continue

        rn = room_number or ""

        # Restaurant booking: confirmation + cancellation flow
        if category == "restaurant_booking":
            if data.get("cancelled", False):
                last_booking = (
                    db.query(RestaurantBooking)
                    .filter(
                        RestaurantBooking.session_id == req.session_id,
                        RestaurantBooking.status == "confirmed",
                    )
                    .order_by(RestaurantBooking.created_at.desc())
                    .first()
                )
                if last_booking:
                    last_booking.status = "cancelled"
                    db.commit()
                processed_actions.append({"category": category, "status": "cancelled"})
                continue
            if not data.get("confirmed", False):
                processed_actions.append({
                    "category": category,
                    "status": "awaiting_confirmation",
                    "data": data,
                })
                continue

        # Process confirmed requests, complaints, and recommendations
        try:
            if category == "complaint":
                workflow_result = process_complaint(
                    db, data, rn, req.session_id, req.message
                )
            elif category in WORKFLOW_MAP:
                workflow_fn = WORKFLOW_MAP[category]
                workflow_result = workflow_fn(db, data, rn, req.session_id)
            else:
                processed_actions.append({"category": category, "status": "unknown"})
                continue

            processed_actions.append({
                "category": category,
                "status": "processed",
                "result": workflow_result,
            })
        except Exception as e:
            logger.error(f"Workflow error ({category}): {e}")
            processed_actions.append({
                "category": category,
                "status": "error",
                "message": "Failed to process this request",
            })

        # Append recommendation details to the reply so guest sees them in chat
        if category == "local_recommendations" and workflow_result.get("success"):
            recs = workflow_result.get("recommendations", [])
            if recs:
                rec_lines = []
                for idx, r in enumerate(recs, 1):
                    rec_lines.append(
                        f"{idx}. **{r['name']}** ({r['type']}) - {r['distance']}\n"
                        f"   {r['description']} | Rating: {r['rating']}"
                    )
                reply += "\n\n" + "\n\n".join(rec_lines)

    # Save assistant reply
    assistant_msg = Conversation(
        session_id=req.session_id,
        role="assistant",
        message=reply,
        category=",".join(a.get("category", "") for a in actions) if actions else None,
    )
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(
        reply=reply,
        actions=processed_actions,
        session_id=req.session_id,
    )


@router.get("/history/{session_id}")
async def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    messages = (
        db.query(Conversation)
        .filter(Conversation.session_id == session_id)
        .order_by(Conversation.created_at.asc())
        .all()
    )
    return [
        {
            "id": m.id,
            "role": m.role,
            "message": m.message,
            "category": m.category,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db: Session = Depends(get_db)):
    """Delete a chat session and all its messages."""
    deleted = (
        db.query(Conversation)
        .filter(Conversation.session_id == session_id)
        .delete()
    )
    db.commit()
    return {"deleted": deleted, "session_id": session_id}


@router.get("/sessions")
async def get_all_sessions(db: Session = Depends(get_db)):
    """Get all unique chat sessions with their first guest message and timestamp."""
    from sqlalchemy import func, distinct

    sessions = (
        db.query(
            Conversation.session_id,
            func.min(Conversation.created_at).label("started_at"),
            func.count(Conversation.id).label("message_count"),
        )
        .group_by(Conversation.session_id)
        .order_by(func.max(Conversation.created_at).desc())
        .limit(50)
        .all()
    )

    result = []
    for s in sessions:
        first_msg = (
            db.query(Conversation)
            .filter(
                Conversation.session_id == s.session_id,
                Conversation.role == "guest",
            )
            .order_by(Conversation.created_at.asc())
            .first()
        )
        result.append({
            "session_id": s.session_id,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "message_count": s.message_count,
            "preview": first_msg.message[:60] if first_msg else "New conversation",
        })

    return result

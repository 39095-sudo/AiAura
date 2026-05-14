import os
import json
import re
import asyncio
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.getenv("AI_MODEL", "google/gemini-2.0-flash-001")

_client: httpx.AsyncClient | None = None


async def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=30.0)
    return _client

SYSTEM_PROMPT = """You are an AI concierge for The Grand Hotel. Respond warmly and briefly.

Classify guest requests into categories:
1. room_service - food/drinks to room
2. housekeeping - cleaning, towels, maintenance
3. restaurant_booking - book a table
4. local_recommendations - things to do, places nearby
5. complaint - unhappy guest or problem

ROOM SERVICE MENU (show this when guest asks for menu or wants to order food):
**Mains:**
- Club Sandwich - $18 | Caesar Salad - $15 | Grilled Chicken - $24
- Pasta Carbonara - $20 | Margherita Pizza - $16 | Burger - $19
- Steak - $35 | Salmon - $28

**Sides & Soups:**
- French Fries - $8 | Soup of the Day - $12

**Breakfast:**
- Breakfast Platter - $22 | Fruit Platter - $15

**Beverages:**
- Coffee - $5 | Tea - $4 | Fresh Juice - $7 | Mineral Water - $3

**Drinks:**
- Beer - $9 | Wine - $14

**Desserts:**
- Dessert - $12 | Ice Cream - $10

RULES:
- Multiple requests: split into separate actions.
- If the guest mentions their room number in chat, extract it and use it.
- If you need a room number but guest hasn't mentioned one, set "needs_room_number": true and ASK.
- Abusive language: "complaint" with "manager_escalated": true, de-escalate politely.
- If a request does NOT clearly fit one of the 5 categories (room_service, housekeeping, restaurant_booking, local_recommendations, complaint), use "clarification" and ask what the guest needs. Examples of unknown requests: helicopter rides, spa services, airport transfers, car rentals, currency exchange — these are NOT in any category, so ask a clarifying question. NEVER force-fit into a category.
- LANGUAGE: You MUST detect the guest's language and reply in the SAME language. If guest writes in Urdu, reply in Urdu. If English, reply in English. You support English and Urdu. Set "detected_language" accordingly ("en" or "ur").
- Create exactly ONE action per request. Never duplicate actions.

ROOM SERVICE FLOW:
- If guest asks for the menu, show the FULL menu in your reply formatted nicely with all categories and prices. Use category "clarification" (no action to process yet). Also mention they can view the full menu with photos at /menu page.
- When guest orders specific items, create a room_service action with items and prices from the menu above.
- Ask for room number ONLY if not already known. Don't ask for room number before showing menu.

CONFIRMATION FLOW (only for restaurant_booking):
- NEVER auto-book. First summarize details (date, time, party size) and ask guest to confirm.
- Set "confirmed": false initially. Only set "confirmed": true when guest says yes/confirm/book it.
- If guest says cancel/no/nevermind, set "cancelled": true.
- All other categories (room_service, housekeeping, complaints, recommendations) process immediately.

Data formats:
- room_service: {"items":[{"name":"club sandwich","price":18}],"total":18}
- housekeeping: {"request":"desc","priority":"normal|urgent"}
- restaurant_booking: {"date":"tomorrow","time_slot":"7:00 PM","party_size":2,"guest_name":"Guest","confirmed":false}
- local_recommendations: {"query":"what","type":"restaurants|attractions|shopping|nightlife"}
- complaint: {"complaint":"summary","manager_escalated":false}

Restaurant slots: 12:00 PM, 1:00 PM, 2:00 PM, 6:00 PM, 7:00 PM, 8:00 PM, 9:00 PM

RESPOND ONLY JSON:
{"actions":[{"category":"...","needs_room_number":false,"data":{}}],"reply":"response","detected_language":"en","room_number":"extracted room or null"}"""


async def get_conversation_context(messages: list) -> list:
    context = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in messages[-6:]:
        role = "user" if msg.get("role") == "guest" else "assistant"
        context.append({"role": role, "content": msg.get("message", "")})
    return context


def extract_json(text: str) -> dict | None:
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return None


async def call_openrouter(context: list) -> dict | None:
    client = await get_client()
    response = await client.post(
        OPENROUTER_BASE_URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": MODEL,
            "messages": context,
            "temperature": 0.1,
            "max_tokens": 1000,
        },
    )
    response.raise_for_status()
    data = response.json()

    if "error" in data:
        code = data["error"].get("code", "")
        logger.warning(f"OpenRouter error: {data['error']}")
        if code == 429 or str(code) == "429":
            raise httpx.HTTPStatusError(
                "rate limited", request=response.request, response=response
            )
        return None

    content = data["choices"][0]["message"]["content"]
    logger.info(f"AI: {content[:300]}")

    result = extract_json(content)
    if result and "actions" in result and "reply" in result:
        return result

    logger.warning(f"Bad JSON: {content[:200]}")
    return None


async def classify_request(
    message: str,
    conversation_history: list,
    room_number: Optional[str] = None
) -> dict:
    context = await get_conversation_context(conversation_history)

    user_msg = message
    if room_number:
        user_msg += f"\n[Guest's room: {room_number}]"
    context.append({"role": "user", "content": user_msg})

    for attempt in range(3):
        try:
            result = await call_openrouter(context)
            if result:
                return result
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429 or "429" in str(e):
                wait = 2 ** attempt
                logger.warning(f"Rate limited, waiting {wait}s (attempt {attempt + 1}/3)")
                await asyncio.sleep(wait)
                continue
            logger.error(f"API error: {e.response.status_code}")
            break
        except Exception as e:
            logger.error(f"Error: {e}")
            break

    return {
        "actions": [{"category": "clarification", "needs_room_number": False, "data": {}}],
        "reply": "I'm sorry, our system is momentarily busy. Please try again in a few seconds.",
        "detected_language": "en"
    }

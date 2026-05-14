# AI Hotel Concierge - The Grand Hotel

An AI-powered hotel concierge system that handles guest requests through natural language chat, intelligently routing each one to the correct service workflow. Built as a full-stack application with a guest-facing chat interface and a staff-facing real-time dashboard.

## Live Demo
- **Live App:** [Deployed URL]
- **GitHub Repo:** [Repo URL]

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Python (FastAPI) + SQLAlchemy ORM |
| Frontend | Next.js 16 (App Router) + Tailwind CSS |
| Database | PostgreSQL 16 |
| AI | OpenRouter API (Google Gemini 2.0 Flash) |
| Containerization | Docker + Docker Compose |
| Deployment | Railway |

## Features

### Guest Chat Interface
- Natural language AI concierge available 24/7
- Multi-session support — create new chats, switch between old ones, delete chats
- Room number extracted naturally from conversation and remembered per session (persisted in DB)
- Markdown rendering in chat (bold, italic, line breaks)
- Multi-language support (English + Urdu)

### Room Service Menu Page
- Visual menu with food images organized by category (Mains, Sides, Breakfast, Beverages, Drinks, Desserts)
- Prices displayed on each item
- AI knows the full menu and shows it when asked in chat

### 5 AI-Routed Workflows
1. **Room Service** — Guest orders from the menu, items logged with prices and total to `kitchen_orders`
2. **Housekeeping** — Requests logged with priority (urgent/normal) to `housekeeping_queue`
3. **Restaurant Booking** — Checks availability against mock time slots, requires guest confirmation before booking, supports cancellation
4. **Local Recommendations** — Returns 3 relevant suggestions (restaurants, attractions, shopping, nightlife) with name, distance, rating, and description
5. **Complaints** — Empathetic de-escalation, abusive messages auto-escalated to manager queue with original message logged

### Staff Dashboard
- Real-time auto-refreshing (5s polling) view of all 5 queues
- Stats cards showing totals, pending counts, and escalation counts
- Interactive charts: request distribution pie, status breakdown bar, priority & escalation mini-pies
- Action buttons on each row: staff can update status (pending → preparing → completed, etc.)
- Loading skeleton on initial load
- Color-coded status badges and priority indicators

## Edge Cases Handled
| Edge Case | How It's Handled |
|-----------|-----------------|
| Guest forgets room number | Bot asks for it before processing. Room number persisted in DB for the session. |
| Multiple requests in one message | AI splits into separate actions, each processed independently |
| Abusive/angry language | Bot de-escalates politely, complaint logged with `manager_escalated = true` and original message preserved |
| Request doesn't fit any category | Bot asks clarifying questions, never invents a category (e.g., "helicopter ride" → clarification) |
| Empty/whitespace message | Rejected by Pydantic validator with clear error |
| Message too long (>2000 chars) | Blocked on both frontend and backend |
| HTML/XSS injection | All input sanitized with `html.escape()` |
| Invalid session ID | Regex validation (alphanumeric + `_-` only) |
| API failure / rate limiting | Retry with exponential backoff (3 attempts), user-friendly error message |
| Workflow processing error | Caught per-workflow, doesn't crash the whole request |
| Network down (frontend) | Shows "Unable to reach the server" instead of generic error |
| localStorage unavailable | Falls back to in-memory storage (private browsing support) |
| Multi-language (Bonus) | Detects Urdu and responds in Urdu; English by default |

## Database Schema

### kitchen_orders
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Auto-increment |
| room_number | VARCHAR(10) | Guest room number |
| items | JSON | Array of {name, price} |
| total | Float | Order total |
| status | VARCHAR(20) | pending / preparing / completed |
| session_id | VARCHAR(100) | Chat session ID |
| created_at | Timestamp | Auto-set |

### housekeeping_queue
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Auto-increment |
| room_number | VARCHAR(10) | Guest room number |
| request | Text | Request description |
| priority | VARCHAR(10) | urgent / normal |
| status | VARCHAR(20) | pending / in_progress / completed |
| session_id | VARCHAR(100) | Chat session ID |
| created_at | Timestamp | Auto-set |

### restaurant_bookings
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Auto-increment |
| guest_name | VARCHAR(100) | Guest name |
| room_number | VARCHAR(10) | Guest room number |
| date | VARCHAR(20) | Booking date (YYYY-MM-DD) |
| time_slot | VARCHAR(20) | Time slot (e.g., 7:00 PM) |
| party_size | Integer | Number of guests |
| status | VARCHAR(20) | confirmed / completed / cancelled |
| session_id | VARCHAR(100) | Chat session ID |
| created_at | Timestamp | Auto-set |

### complaints
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Auto-increment |
| room_number | VARCHAR(10) | Guest room number |
| complaint | Text | Complaint summary |
| original_message | Text | Original guest message (preserved) |
| manager_escalated | Boolean | Whether escalated to manager |
| status | VARCHAR(20) | open / in_progress / resolved |
| session_id | VARCHAR(100) | Chat session ID |
| created_at | Timestamp | Auto-set |

### recommendations_log
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Auto-increment |
| room_number | VARCHAR(10) | Guest room number (nullable) |
| query | Text | What was asked |
| recommendations | JSON | Array of recommendations given |
| session_id | VARCHAR(100) | Chat session ID |
| created_at | Timestamp | Auto-set |

### conversations
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Auto-increment |
| session_id | VARCHAR(100) | Chat session ID (indexed) |
| role | VARCHAR(20) | guest / assistant |
| message | Text | Message content |
| category | VARCHAR(200) | Detected workflow category |
| room_number | VARCHAR(10) | Room number (persisted per session) |
| created_at | Timestamp | Auto-set |

## Setup Instructions

### Docker (Recommended)
```bash
# Clone the repo
git clone <repo-url>
cd hotel-concierge

# Create backend .env
cp backend/.env.example backend/.env
# Edit backend/.env — add your OPENROUTER_API_KEY

# Start everything (PostgreSQL + Backend + Frontend)
docker compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Dashboard: http://localhost:3000/dashboard
# Menu: http://localhost:3000/menu
```

### Manual Setup
**Backend:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your DATABASE_URL and OPENROUTER_API_KEY
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

### Railway Deployment
1. Create a new Railway project
2. Add a PostgreSQL service
3. Add backend service (root directory: `/backend`)
   - Set env vars: `DATABASE_URL` (from Postgres), `OPENROUTER_API_KEY`, `ALLOWED_ORIGINS`
4. Add frontend service (root directory: `/frontend`)
   - Set build arg + env var: `NEXT_PUBLIC_API_URL` (backend Railway URL)

## Assumptions
- Hotel is "The Grand Hotel" in a generic upscale city
- Restaurant has 7 time slots (12 PM – 9 PM) with defined capacity per slot
- Room service menu has 20 items with fixed prices
- Local recommendations use realistic mock data (per task brief: "fake data is acceptable but make it realistic")
- Guest sessions are browser-based (localStorage) with full history in PostgreSQL
- Priority classification is binary: "urgent" (emergencies) or "normal" (everything else)
- Restaurant bookings require explicit guest confirmation; other services process immediately

## Known Limitations
- No authentication (guest/staff access is page-based)
- Dashboard uses 5s polling instead of WebSocket
- Room service prices are fixed; unrecognized items default to $15
- Restaurant availability is per-slot capacity, not per-table

## What I Would Improve With More Time
- WebSocket for true real-time dashboard updates
- Staff authentication with role-based access
- Email/SMS notifications for confirmed bookings
- Guest feedback/rating system after service completion
- Integration with a real maps API for local recommendations

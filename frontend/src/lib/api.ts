const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI(endpoint: string, options?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Unable to reach the server. Please check your connection.");
  }
  if (!res.ok) {
    let detail = `Server error (${res.status})`;
    try {
      const body = await res.json();
      if (body.detail) {
        detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      }
    } catch { /* ignore */ }
    throw new Error(detail);
  }
  return res.json();
}

export async function sendMessage(message: string, sessionId: string) {
  return fetchAPI("/api/chat/send", {
    method: "POST",
    body: JSON.stringify({ message, session_id: sessionId }),
  });
}

export async function getChatHistory(sessionId: string) {
  return fetchAPI(`/api/chat/history/${sessionId}`);
}

export async function getChatSessions() {
  return fetchAPI("/api/chat/sessions");
}

export async function deleteChatSession(sessionId: string) {
  return fetchAPI(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
}

export async function getKitchenOrders() {
  return fetchAPI("/api/dashboard/kitchen-orders");
}

export async function getHousekeeping() {
  return fetchAPI("/api/dashboard/housekeeping");
}

export async function getRestaurantBookings() {
  return fetchAPI("/api/dashboard/restaurant-bookings");
}

export async function getComplaints() {
  return fetchAPI("/api/dashboard/complaints");
}

export async function getRecommendations() {
  return fetchAPI("/api/dashboard/recommendations");
}

export async function getDashboardStats() {
  return fetchAPI("/api/dashboard/stats");
}

export async function updateItemStatus(queue: string, itemId: number, status: string) {
  return fetchAPI(`/api/dashboard/${queue}/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

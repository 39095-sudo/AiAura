export interface ChatMessage {
  id?: number;
  role: "guest" | "assistant";
  message: string;
  category?: string | null;
  created_at?: string;
}

export interface KitchenOrder {
  id: number;
  room_number: string;
  items: { name: string; price: number }[];
  total: number;
  status: string;
  created_at: string;
}

export interface HousekeepingRequest {
  id: number;
  room_number: string;
  request: string;
  priority: "urgent" | "normal";
  status: string;
  created_at: string;
}

export interface RestaurantBooking {
  id: number;
  guest_name: string;
  room_number: string;
  date: string;
  time_slot: string;
  party_size: number;
  status: string;
  created_at: string;
}

export interface Complaint {
  id: number;
  room_number: string;
  complaint: string;
  original_message: string;
  manager_escalated: boolean;
  status: string;
  created_at: string;
}

export interface Recommendation {
  id: number;
  room_number: string | null;
  query: string;
  recommendations: { name: string; type: string; distance: string; rating: string; description: string }[];
  created_at: string;
}

export interface ChatSession {
  session_id: string;
  started_at: string | null;
  message_count: number;
  preview: string;
}

export interface DashboardStats {
  kitchen_orders: number;
  housekeeping: number;
  restaurant_bookings: number;
  complaints: number;
  recommendations: number;
  pending_kitchen: number;
  pending_housekeeping: number;
  open_complaints: number;
  escalated_complaints: number;
}

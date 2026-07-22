import api from "./api";
import type { Order } from "../hooks/useDashboardData";

// Marks (or unmarks) an order as collected. The server is the source of
// truth for whether this is allowed: an unpaid order returns 409 with a
// human-readable reason rather than silently doing nothing, and the caller
// is expected to surface that message rather than swallow it.
export const markOrderCollected = async (id: number, collected: boolean): Promise<Order> => {
  const res = await api.patch<Order>(`/payment/orders/${id}/collected`, { collected });
  return res.data;
};

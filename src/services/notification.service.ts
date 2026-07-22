import api from "./api";

export interface NotificationRecipient {
  id: string;
  email: string;
  name: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipientRequest {
  email: string;
  name?: string;
}

export async function getAllRecipients(): Promise<NotificationRecipient[]> {
  const { data } = await api.get<NotificationRecipient[]>("/notification-recipients");
  return data;
}

export async function createRecipient(
  payload: CreateRecipientRequest,
): Promise<NotificationRecipient> {
  const { data } = await api.post<NotificationRecipient>("/notification-recipients", payload);
  return data;
}

export async function updateRecipient(
  id: string,
  payload: { active?: boolean; name?: string },
): Promise<NotificationRecipient> {
  const { data } = await api.patch<NotificationRecipient>(`/notification-recipients/${id}`, payload);
  return data;
}

export async function deleteRecipient(id: string): Promise<void> {
  await api.delete(`/notification-recipients/${id}`);
}

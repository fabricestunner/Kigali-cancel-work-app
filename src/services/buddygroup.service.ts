import api from "./api";

export interface BuddyGroup {
  id: number;
  name: string;
  leader_name: string;
  leader_email: string;
  members: number;
  createdAt: string;
  updatedAt: string;
}

export interface BuddyGroupDTO {
  name: string;
  leader_name: string;
  leader_email: string;
  members?: number;
}

export const getAllBuddyGroups = async (): Promise<BuddyGroup[]> => {
  const res = await api.get<BuddyGroup[]>("/buddy-group");
  return res.data;
};

export const createBuddyGroup = async (data: BuddyGroupDTO): Promise<BuddyGroup> => {
  const res = await api.post<BuddyGroup>("/buddy-group", data);
  return res.data;
};

export const updateBuddyGroup = async (
  id: number,
  data: Partial<BuddyGroupDTO>,
): Promise<BuddyGroup> => {
  const res = await api.patch<BuddyGroup>(`/buddy-group/${id}`, data);
  return res.data;
};

export const deleteBuddyGroup = async (id: number): Promise<void> => {
  await api.delete(`/buddy-group/${id}`);
};

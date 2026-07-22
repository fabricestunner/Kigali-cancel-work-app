import api from "./api";

export interface SubmitInfluencerDTO {
  full_name: string;
  email: string;
  phone?: string;
  social_media?: Record<string, string>;
}

export interface Influencer {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  
  social_media: Record<string, string> | null;
  status: "pending" | "contacted" | "confirmed";
  createdAt: string;
  updatedAt: string;
}

export const submitInfluencer = async (data: SubmitInfluencerDTO): Promise<void> => {
  await api.post("/influencer/submit", data);
};

export const getAllInfluencers = async (): Promise<Influencer[]> => {
  const res = await api.get<Influencer[]>("/influencer");
  return res.data;
};

export const updateInfluencerStatus = async (
  id: number,
  status: "pending" | "contacted" | "confirmed",
): Promise<Influencer> => {
  const res = await api.patch<Influencer>(`/influencer/${id}/status`, { status });
  return res.data;
};

export const deleteInfluencer = async (id: number): Promise<void> => {
  await api.delete(`/influencer/${id}`);
};

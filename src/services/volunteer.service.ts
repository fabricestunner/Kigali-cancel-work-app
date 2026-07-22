import api from "./api";

export type VolunteerAffiliation = "rotaractor" | "rotarian" | "none";

export interface SubmitVolunteerDTO {
  full_name: string;
  email: string;
  phone?: string;
  affiliation: VolunteerAffiliation;
  team?: string;
  rotary_club?: string;
}

export interface Volunteer {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  affiliation: VolunteerAffiliation;
  team: string | null;
  rotary_club: string | null;
  status: "pending" | "contacted" | "confirmed";
  createdAt: string;
  updatedAt: string;
}

export const submitVolunteer = async (data: SubmitVolunteerDTO): Promise<void> => {
  await api.post("/volunteer/submit", data);
};

export const getAllVolunteers = async (): Promise<Volunteer[]> => {
  const res = await api.get<Volunteer[]>("/volunteer");
  return res.data;
};

export const updateVolunteerStatus = async (
  id: number,
  status: "pending" | "contacted" | "confirmed",
): Promise<Volunteer> => {
  const res = await api.patch<Volunteer>(`/volunteer/${id}/status`, { status });
  return res.data;
};

export const deleteVolunteer = async (id: number): Promise<void> => {
  await api.delete(`/volunteer/${id}`);
};

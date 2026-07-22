import api from "./api";

export interface SubmitSponsorDTO {
  full_name: string;
  email: string;
  phone: string;
  company_name?: string;
  message?: string;
  package_amount: string;
  package_label: string;
}

export interface Sponsor {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  company_name: string | null;
  message: string | null;
  package_amount: string;
  package_label: string;
  status: "pending" | "contacted" | "completed";
  createdAt: string;
  updatedAt: string;
}

export const submitSponsorship = async (data: SubmitSponsorDTO): Promise<void> => {
  await api.post("/sponsor/submit", data);
};

export const getAllSponsors = async (): Promise<Sponsor[]> => {
  const res = await api.get<Sponsor[]>("/sponsor");
  return res.data;
};

export const updateSponsorStatus = async (
  id: number,
  status: "pending" | "contacted" | "completed",
): Promise<Sponsor> => {
  const res = await api.patch<Sponsor>(`/sponsor/${id}/status`, { status });
  return res.data;
};

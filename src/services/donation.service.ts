import api from "./api";

export interface CreateDonationDTO {
  full_name: string;
  email: string;
  phone: string;
  amount: number;
  currency: "USD" | "RWF";
  quantity: number;
}

export interface Donation {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  amount: string;
  currency: "USD" | "RWF";
  quantity: number;
  total_amount: string;
  status: "pending" | "paid" | "failed";
  payment_ref: string | null;
  anonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DonationStats {
  totalDonations: number;
  paidDonations: number;
  totalUSD: number;
  totalRWF: number;
}

export const createDonation = async (data: CreateDonationDTO) => {
  const res = await api.post<{ paymentUrl: string; paymentRef: string }>(
    "/donation/create",
    data,
  );
  return res.data;
};

export const getAllDonations = async (): Promise<Donation[]> => {
  const res = await api.get<Donation[]>("/donation");
  return res.data;
};

export const getDonationStats = async (): Promise<DonationStats> => {
  const res = await api.get<DonationStats>("/donation/stats");
  return res.data;
};

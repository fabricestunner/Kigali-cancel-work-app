import api from "./api";

export const PICKUP_LOCATIONS = [
  "High Land Suit - NYARUTARAMA",
  "Car Free Zone",
] as const;

export interface FreeKitVerifyResponse {
  valid: boolean;
  token: string;
  buyer_name: string;
}

export interface FreeKitRedeemResponse {
  message: string;
  token: string;
  kit_size: string;
  pickup_location: string;
  buyer_email: string;
  qr: string; // PNG data URL
}

export const verifyFreeKitToken = async (
  token: string,
): Promise<FreeKitVerifyResponse> => {
  const res = await api.post<FreeKitVerifyResponse>("/free-kit/verify", { token });
  return res.data;
};

export const redeemFreeKitToken = async (data: {
  token: string;
  stock_id: number;
  pickup_location: string;
}): Promise<FreeKitRedeemResponse> => {
  const res = await api.post<FreeKitRedeemResponse>("/free-kit/redeem", data);
  return res.data;
};

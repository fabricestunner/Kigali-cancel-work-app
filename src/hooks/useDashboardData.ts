import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

export interface StockItem {
  id: number;
  item: string;
  starting_stock: number;
  remaining: number;
  createdAt: string;
}

export interface OrderBuddyGroup {
  id: number;
  name: string;
  leader_name: string;
  leader_email: string;
}

export interface Order {
  id: number;
  full_name: string;
  email: string;
  phone_number: number;
  quantity: number;
  amount_paid: number;
  currency: string;
  status: string;
  payment_ref: string | null;
  delivery_option: string;
  location: string;
  notes: string | null;
  buddy_group_id: number | null;
  buddy_group: OrderBuddyGroup | null;
  createdAt: string;
  stock: StockItem;
  collected: boolean;
  collected_at: string | null;
  collected_by: string | null;
  _count?: { tickets: number };
}

export interface Donation {
  id: number;
  full_name: string;
  email: string;
  amount: string;
  currency: string;
  total_amount: string;
  status: string;
  anonymous: boolean;
  createdAt: string;
}

export interface DonationStats {
  totalDonations: number;
  paidDonations: number;
  totalUSD: string;
  totalRWF: string;
}

export interface Sponsor {
  id: number;
  full_name: string;
  company_name: string | null;
  package_label: string;
  status: string;
  createdAt: string;
}

export interface Volunteer {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
}

export interface Influencer {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  social_media: Record<string, string> | null;
  status: string;
  createdAt: string;
}

export interface DashboardData {
  stocks: StockItem[];
  orders: Order[];
  donationStats: DonationStats;
  donations: Donation[];
  sponsors: Sponsor[];
  volunteers: Volunteer[];
  influencers: Influencer[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const EMPTY_STATS: DonationStats = {
  totalDonations: 0,
  paidDonations: 0,
  totalUSD: "0",
  totalRWF: "0",
};

export function useDashboardData(): DashboardData {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [donationStats, setDonationStats] = useState<DonationStats>(EMPTY_STATS);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stockRes, orderRes, statsRes, donationRes, sponsorRes, volunteerRes, influencerRes] =
        await Promise.all([
          api.get<StockItem[]>("/stock"),
          api.get<Order[]>("/payment/orders"),
          api.get<DonationStats>("/donation/stats"),
          api.get<Donation[]>("/donation"),
          api.get<Sponsor[]>("/sponsor"),
          api.get<Volunteer[]>("/volunteer"),
          api.get<Influencer[]>("/influencer"),
        ]);

      setStocks(stockRes.data);
      setOrders(orderRes.data);
      setDonationStats(statsRes.data);
      setDonations(donationRes.data);
      setSponsors(sponsorRes.data);
      setVolunteers(volunteerRes.data);
      setInfluencers(influencerRes.data);
    } catch {
      setError("Failed to load dashboard data. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  return { stocks, orders, donationStats, donations, sponsors, volunteers, influencers, loading, error, refresh: fetchData };
}

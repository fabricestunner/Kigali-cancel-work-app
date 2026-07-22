import api from "./api";

/* =========================
   TYPES (optional but recommended)
========================= */

export interface Stock {
  id: number;
  item: string;
  starting_stock: number;
  remaining: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStockDTO {
  item: string;
  starting_stock: number;
  remaining: number;
}

export interface UpdateStockDTO {
  item?: string;
  starting_stock?: number;
  remaining?: number;
}

/* =========================
   API CALLS
========================= */

// GET ALL STOCK
export const getStock = async (): Promise<Stock[]> => {
  const response = await api.get("/stock");
  return response.data;
};

// GET SINGLE STOCK (optional but useful)
export const getStockById = async (id: number): Promise<Stock> => {
  const response = await api.get(`/stock/${id}`);
  return response.data;
};

// CREATE STOCK (POST)
export const createStock = async (data: CreateStockDTO): Promise<Stock> => {
  const response = await api.post("/stock", data);
  return response.data;
};

// UPDATE STOCK (PUT)
export const updateStock = async (
  id: number,
  data: UpdateStockDTO
): Promise<Stock> => {
  const response = await api.put(`/stock/${id}`, data);
  return response.data;
};

// DELETE STOCK
export const deleteStock = async (id: number): Promise<void> => {
  await api.delete(`/stock/${id}`);
};
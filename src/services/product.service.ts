import api from "./api";
import type { Product } from "../types";

export type { Product };

export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get("/product");
  return response.data;
};

export const getProductById = async (id: number): Promise<Product> => {
  const response = await api.get(`/product/${id}`);
  return response.data;
};

export const createProduct = async (data: {
  name: string;
  description: string;
  price: number;
  image: File;
}): Promise<Product> => {
  const form = new FormData();
  form.append("name", data.name);
  form.append("description", data.description);
  form.append("price", String(data.price));
  form.append("image", data.image);

  const response = await api.post("/product", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateProduct = async (
  id: number,
  data: {
    name?: string;
    description?: string;
    price?: number;
    image?: File;
  }
): Promise<Product> => {
  const form = new FormData();
  if (data.name) form.append("name", data.name);
  if (data.description) form.append("description", data.description);
  if (data.price !== undefined) form.append("price", String(data.price));
  if (data.image) form.append("image", data.image);

  const response = await api.put(`/product/${id}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/product/${id}`);
};

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  size: string;
  quantity: number;
  stockId: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface CheckoutFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  pickupLocation: string;
  preferredDate: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  total: number;
  formData: CheckoutFormData;
  createdAt: Date;
}

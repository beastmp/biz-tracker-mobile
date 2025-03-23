import axios from 'axios';
import { config } from '../config/env';

// Define item interface
export interface Item {
  _id?: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  description?: string;
  imageUrl?: string;  // New field for storing image URLs
  tags?: string[];    // New field for storing tags
  lastUpdated?: Date;
  trackingType?: 'quantity' | 'weight';
  weight?: number;
  weightUnit?: 'oz' | 'lb' | 'g' | 'kg';
  priceType?: 'each' | 'per_weight_unit';
}

// Define sale item interface
export interface SaleItem {
  item: string | Item; // ID or full Item object when populated
  quantity: number;
  priceAtSale: number;
}

// Define sale interface
export interface Sale {
  _id?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: 'cash' | 'credit' | 'debit' | 'check' | 'other';
  notes?: string;
  status: 'completed' | 'refunded' | 'partially_refunded';
  createdAt?: Date;
  updatedAt?: Date;
}

// Define purchase item interface
export interface PurchaseItem {
  item: string | Item;
  quantity?: number;
  weight?: number;
  weightUnit?: 'oz' | 'lb' | 'g' | 'kg';
  costPerUnit: number;
  totalCost: number;
}

// Define purchase interface
export interface Purchase {
  _id?: string;
  supplier: {
    name?: string;
    contactName?: string;
    email?: string;
    phone?: string;
  };
  items: PurchaseItem[];
  invoiceNumber?: string;
  purchaseDate?: Date;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  shippingCost?: number;
  total: number;
  notes?: string;
  paymentMethod: 'cash' | 'credit' | 'debit' | 'check' | 'bank_transfer' | 'other';
  status: 'pending' | 'received' | 'partially_received' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

// Create API instance
const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Add a 10 second timeout
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Starting Request', {
    url: request.url,
    baseURL: request.baseURL
  });
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.log('API Error Details:', {
      message: error.message,
      code: error.code,
      config: {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method
      }
    });
    return Promise.reject(error);
  }
);

// Items API methods
export const itemsApi = {
  getAll: async (): Promise<Item[]> => {
    const response = await api.get('/api/items');
    return response.data;
  },
  getById: async (id: string): Promise<Item> => {
    const response = await api.get(`/api/items/${id}`);
    return response.data;
  },
  create: async (item: Item | FormData): Promise<Item> => {
    // Handle both regular JSON and FormData
    const config = item instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' }} 
      : {};
      
    const response = await api.post('/api/items', item, config);
    return response.data;
  },
  update: async (id: string, item: Partial<Item> | FormData): Promise<Item> => {
    // Handle both regular JSON and FormData
    const config = item instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' }} 
      : {};
      
    const response = await api.patch(`/api/items/${id}`, item, config);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/items/${id}`);
  },
};

// Sales API methods
export const salesApi = {
  getAll: async (): Promise<Sale[]> => {
    const response = await api.get('/api/sales');
    return response.data;
  },
  getById: async (id: string): Promise<Sale> => {
    const response = await api.get(`/api/sales/${id}`);
    return response.data;
  },
  create: async (sale: Sale): Promise<Sale> => {
    const response = await api.post('/api/sales', sale);
    return response.data;
  },
  update: async (id: string, sale: Partial<Sale>): Promise<Sale> => {
    const response = await api.patch(`/api/sales/${id}`, sale);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/sales/${id}`);
  },
  getReport: async (startDate?: string, endDate?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/api/sales/reports/by-date?${params.toString()}`);
    return response.data;
  }
};

// Purchases API methods
export const purchasesApi = {
  getAll: async (): Promise<Purchase[]> => {
    try {
      const response = await api.get('/api/purchases');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
      throw error;
    }
  },
  
  getById: async (id: string): Promise<Purchase> => {
    try {
      const response = await api.get(`/api/purchases/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch purchase with id ${id}:`, error);
      throw error;
    }
  },
  
  create: async (purchase: Purchase): Promise<Purchase> => {
    try {
      const response = await api.post('/api/purchases', purchase);
      return response.data;
    } catch (error) {
      console.error('Failed to create purchase:', error);
      throw error;
    }
  },
  
  update: async (id: string, purchase: Partial<Purchase>): Promise<Purchase> => {
    try {
      const response = await api.patch(`/api/purchases/${id}`, purchase);
      return response.data;
    } catch (error) {
      console.error(`Failed to update purchase with id ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/purchases/${id}`);
    } catch (error) {
      console.error(`Failed to delete purchase with id ${id}:`, error);
      throw error;
    }
  },
  
  getReport: async (startDate?: string, endDate?: string): Promise<any> => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/api/purchases/reports/by-date?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get purchase report:', error);
      throw error;
    }
  }
};

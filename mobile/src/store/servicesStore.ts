import { create } from 'zustand';
import { api } from '../services/api';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  rating: number;
  review_count: number;
  provider_id: string;
  distance_km?: number;
  quality_tier?: 'good' | 'medium' | 'low';
  price_tier?: 'low' | 'medium' | 'high';
  provider?: { business_name: string; average_rating: number; latitude?: number; longitude?: number };
}

interface ServicesStore {
  services: Service[];
  categories: string[];
  selectedService: Service | null;
  isLoading: boolean;
  error: string | null;

  listServices: (filters?: any) => Promise<void>;
  getService: (id: string) => Promise<void>;
  nearbyServices: (latitude: number, longitude: number) => Promise<void>;
  getCategories: () => Promise<void>;
  setSelectedService: (service: Service | null) => void;
  clearError: () => void;
}

export const useServicesStore = create<ServicesStore>((set) => ({
  services: [],
  categories: [],
  selectedService: null,
  isLoading: false,
  error: null,

  listServices: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.listServices(filters);
      set({ services: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  getService: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getService(id);
      set({ selectedService: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  nearbyServices: async (latitude, longitude) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.nearbyServices(latitude, longitude);
      set({ services: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  getCategories: async () => {
    try {
      const response = await api.getCategories();
      set({ categories: response.data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setSelectedService: (service) => set({ selectedService: service }),
  clearError: () => set({ error: null }),
}));

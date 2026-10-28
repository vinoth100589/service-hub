import { create } from 'zustand';
import { api } from '../services/api';

interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  provider_id: string;
  status: string;
  scheduled_date: string;
  service_address: string;
  notes?: string;
  created_at: string;
  name?: string;
  base_price?: number;
  business_name?: string;
  provider_user_id?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  viewer_role?: 'customer' | 'provider';
}

interface BookingStore {
  bookings: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  error: string | null;

  listBookings: () => Promise<void>;
  getBooking: (id: string) => Promise<void>;
  createBooking: (serviceId: string, scheduledDate: string, address: string, notes?: string) => Promise<void>;
  acceptBooking: (id: string) => Promise<void>;
  rejectBooking: (id: string) => Promise<void>;
  completeBooking: (id: string) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  setCurrentBooking: (booking: Booking | null) => void;
  clearError: () => void;
}

function upsert(bookings: Booking[], updated: Booking) {
  return bookings.map((b) => (b.id === updated.id ? updated : b));
}

export const useBookingStore = create<BookingStore>((set) => ({
  bookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,

  listBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.listBookings();
      set({ bookings: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  getBooking: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.getBooking(id);
      set({ currentBooking: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createBooking: async (serviceId, scheduledDate, address, notes) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.createBooking(serviceId, scheduledDate, address, notes);
      set((state) => ({
        bookings: [response.data, ...state.bookings],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  acceptBooking: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.acceptBooking(id);
      set((state) => ({
        bookings: upsert(state.bookings, response.data),
        currentBooking: response.data,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  rejectBooking: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.rejectBooking(id);
      set((state) => ({
        bookings: upsert(state.bookings, response.data),
        currentBooking: response.data,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  completeBooking: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.completeBooking(id);
      set((state) => ({
        bookings: upsert(state.bookings, response.data),
        currentBooking: response.data,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  cancelBooking: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.cancelBooking(id);
      set((state) => ({
        bookings: upsert(state.bookings, response.data),
        currentBooking: response.data,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  setCurrentBooking: (booking) => set({ currentBooking: booking }),
  clearError: () => set({ error: null }),
}));

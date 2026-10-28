import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// The Android emulator's "localhost" refers to the emulator itself, not the
// host machine — 10.0.2.2 is the documented alias Google provides for the
// host's loopback interface. iOS Simulator and web share the host's network
// namespace directly, so plain localhost works there.
// A physical device needs the dev machine's real LAN IP instead of either —
// set EXPO_PUBLIC_API_HOST to override when testing on hardware.
const DEV_HOST = process.env.EXPO_PUBLIC_API_HOST || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
const API_URL = `http://${DEV_HOST}:8080/api/v1`;

class APIClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
    });

    this.client.interceptors.request.use(async (config) => {
      // Goes through getAccessToken() (not the bare in-memory field) so the
      // very first request after a fresh app load — e.g. the boot-time
      // /auth/me check — lazily hydrates from AsyncStorage instead of firing
      // unauthenticated. Without this, that first request always 401s, and
      // the response interceptor's auto-logout then wipes the still-valid
      // stored token, silently logging the user out on every app restart.
      const token = await this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Skip on the logout call itself — otherwise an already-invalid
        // token makes logout()'s own request 401, which would re-trigger
        // this handler and call logout() again, recursively.
        const isLogoutRequest = error.config?.url === '/auth/logout';
        if (error.response?.status === 401 && !isLogoutRequest) {
          // Token expired, logout
          await this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  async setAccessToken(token: string) {
    this.accessToken = token;
    await AsyncStorage.setItem('accessToken', token);
  }

  async getAccessToken() {
    if (!this.accessToken) {
      this.accessToken = await AsyncStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } catch {
      // Best-effort — still clear the local token even if the request fails
      // (offline, already-expired token, etc), since local logout must never
      // get stuck on a network round trip.
    }
    this.accessToken = null;
    await AsyncStorage.removeItem('accessToken');
  }

  // Auth endpoints
  async register(email: string, password: string, first_name: string, last_name: string) {
    const response = await this.client.post('/auth/register', {
      email,
      password,
      first_name,
      last_name,
    });
    if (response.data.access_token) {
      await this.setAccessToken(response.data.access_token);
    }
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.access_token) {
      await this.setAccessToken(response.data.access_token);
    }
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.client.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string) {
    const response = await this.client.post('/auth/reset-password', { token, password });
    return response.data;
  }

  async savePushToken(pushToken: string) {
    const response = await this.client.put('/auth/push-token', { push_token: pushToken });
    return response.data;
  }

  async verifyEmail(token: string) {
    const response = await this.client.post('/auth/verify-email', { token });
    return response.data;
  }

  async resendVerification(email: string) {
    const response = await this.client.post('/auth/resend-verification', { email });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async updateProfile(updates: Partial<{ first_name: string; last_name: string; phone: string; bio: string; avatar_url: string }>) {
    const response = await this.client.put('/auth/me', updates);
    return response.data;
  }

  // Service endpoints
  async listServices(filters?: any) {
    const response = await this.client.get('/services', { params: filters });
    return response.data;
  }

  async getService(id: string) {
    const response = await this.client.get(`/services/${id}`);
    return response.data;
  }

  async nearbyServices(latitude: number, longitude: number, radiusKm?: number) {
    const response = await this.client.get('/services/nearby', {
      params: { latitude, longitude, radiusKm: radiusKm || 10 },
    });
    return response.data;
  }

  async getCategories() {
    const response = await this.client.get('/services/categories');
    return response.data;
  }

  // Booking endpoints
  async createBooking(serviceId: string, scheduledDate: string, serviceAddress: string, notes?: string) {
    const response = await this.client.post('/bookings', {
      service_id: serviceId,
      scheduled_date: scheduledDate,
      service_address: serviceAddress,
      notes,
    });
    return response.data;
  }

  async listBookings(limit = 50, offset = 0) {
    const response = await this.client.get('/bookings', { params: { limit, offset } });
    return response.data;
  }

  async getBooking(id: string) {
    const response = await this.client.get(`/bookings/${id}`);
    return response.data;
  }

  async acceptBooking(id: string) {
    const response = await this.client.put(`/bookings/${id}/accept`);
    return response.data;
  }

  async completeBooking(id: string) {
    const response = await this.client.put(`/bookings/${id}/complete`);
    return response.data;
  }

  async rejectBooking(id: string) {
    const response = await this.client.put(`/bookings/${id}/reject`);
    return response.data;
  }

  async cancelBooking(id: string) {
    const response = await this.client.put(`/bookings/${id}/cancel`);
    return response.data;
  }

  // Review endpoints
  async submitReview(bookingId: string, rating: number, title: string, content: string) {
    const response = await this.client.post('/reviews', {
      booking_id: bookingId,
      rating,
      title,
      content,
    });
    return response.data;
  }

  async listReviews() {
    const response = await this.client.get('/reviews');
    return response.data;
  }

  async getReview(reviewId: string) {
    const response = await this.client.get(`/reviews/${reviewId}`);
    return response.data;
  }

  async getProviderReviews(providerId: string) {
    const response = await this.client.get(`/reviews/provider/${providerId}`);
    return response.data;
  }

  async updateReview(reviewId: string, updates: Partial<{ rating: number; content: string }>) {
    const response = await this.client.put(`/reviews/${reviewId}`, updates);
    return response.data;
  }

  async deleteReview(reviewId: string) {
    const response = await this.client.delete(`/reviews/${reviewId}`);
    return response.data;
  }

  async markReviewHelpful(reviewId: string) {
    const response = await this.client.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  }

  // Message endpoints
  async sendMessage(bookingId: string, receiverId: string, content: string) {
    const response = await this.client.post('/messages', {
      booking_id: bookingId,
      receiver_id: receiverId,
      content,
    });
    return response.data;
  }

  async getMessages(bookingId: string) {
    const response = await this.client.get(`/messages/${bookingId}`);
    return response.data;
  }

  async getConversations() {
    const response = await this.client.get('/messages/conversations');
    return response.data;
  }

  async markMessageRead(messageId: string) {
    const response = await this.client.put(`/messages/${messageId}/read`);
    return response.data;
  }

  async deleteMessage(messageId: string) {
    const response = await this.client.delete(`/messages/${messageId}`);
    return response.data;
  }

  // Payment endpoints
  async createPaymentIntent(bookingId: string, amount: number, promoCode?: string) {
    const response = await this.client.post('/payments/intent', {
      booking_id: bookingId,
      amount,
      ...(promoCode ? { promo_code: promoCode } : {}),
    });
    return response.data;
  }

  async validatePromo(code: string, bookingAmount: number) {
    const response = await this.client.post('/promos/validate', { code, booking_amount: bookingAmount });
    return response.data;
  }

  async confirmPayment(paymentId: string, stripeChargeId: string) {
    const response = await this.client.post('/payments/confirm', {
      payment_id: paymentId,
      stripe_charge_id: stripeChargeId,
    });
    return response.data;
  }

  async listPayments(limit = 20, offset = 0) {
    const response = await this.client.get('/payments', { params: { limit, offset } });
    return response.data;
  }

  async refundPayment(paymentId: string) {
    const response = await this.client.post(`/payments/${paymentId}/refund`);
    return response.data;
  }

  // Provider endpoints
  async applyAsProvider(businessName: string, description: string, categories: string[] = []) {
    const response = await this.client.post('/providers/apply', {
      business_name: businessName,
      business_description: description,
      service_categories: categories,
    });
    return response.data;
  }

  async getProviderProfile() {
    const response = await this.client.get('/providers/profile');
    return response.data;
  }

  async updateProviderSettings(updates: any) {
    const response = await this.client.put('/providers/settings', updates);
    return response.data;
  }

  async updateAvailability(availability: Record<string, string[]>) {
    const response = await this.client.put('/providers/availability', { availability });
    return response.data;
  }

  // Provider's own service management
  async getMyServices() {
    const response = await this.client.get('/services/mine');
    return response.data;
  }

  async createService(service: {
    name: string;
    description: string;
    category: string;
    base_price: number;
    price_unit: 'hourly' | 'flat_rate' | 'project';
    duration_minutes?: number;
  }) {
    const response = await this.client.post('/services', service);
    return response.data;
  }

  async updateService(serviceId: string, updates: Partial<{
    name: string;
    description: string;
    category: string;
    base_price: number;
    price_unit: string;
    is_active: boolean;
  }>) {
    const response = await this.client.put(`/services/${serviceId}`, updates);
    return response.data;
  }

  async deleteService(serviceId: string) {
    const response = await this.client.delete(`/services/${serviceId}`);
    return response.data;
  }

  // Dispute endpoints
  async createDispute(bookingId: string, title: string, description: string) {
    const response = await this.client.post('/disputes', {
      booking_id: bookingId,
      title,
      description,
    });
    return response.data;
  }

  async listMyDisputes() {
    const response = await this.client.get('/disputes');
    return response.data;
  }

  async getPayouts() {
    const response = await this.client.get('/payments/provider/payouts');
    return response.data;
  }

  // Notification endpoints
  async listNotifications() {
    const response = await this.client.get('/notifications');
    return response.data;
  }

  async markNotificationRead(notificationId: string) {
    const response = await this.client.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.client.put('/notifications/read-all');
    return response.data;
  }

  // Favorites (saved providers)
  async listFavorites() {
    const response = await this.client.get('/favorites');
    return response.data;
  }

  async addFavorite(providerId: string) {
    const response = await this.client.post('/favorites', { provider_id: providerId });
    return response.data;
  }

  async removeFavorite(providerId: string) {
    const response = await this.client.delete(`/favorites/${providerId}`);
    return response.data;
  }

  // Image uploads. `uri` is a local file:// (or web blob:) URI from
  // expo-image-picker; React Native's fetch/FormData implementation uploads
  // directly from that URI when given {uri, name, type}, no separate read step.
  async uploadAvatar(uri: string) {
    const form = new FormData();
    form.append('image', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
    const response = await this.client.post('/uploads/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async uploadServiceImages(serviceId: string, uris: string[]) {
    const form = new FormData();
    uris.forEach((uri, i) => {
      form.append('images', { uri, name: `service-${i}.jpg`, type: 'image/jpeg' } as any);
    });
    const response = await this.client.post(`/uploads/services/${serviceId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

export const api = new APIClient();

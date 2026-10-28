# 📱 ServiceHub Mobile App - Complete Setup Guide

## Overview

**Framework**: React Native with Expo  
**Platforms**: iOS & Android  
**State Management**: Zustand  
**Navigation**: React Navigation  
**API Integration**: Axios  

---

## 🚀 Quick Start (5 Minutes)

### 1. Install Expo CLI
```bash
npm install -g expo-cli
```

### 2. Install Dependencies
```bash
cd /Users/vinoth-2442/Personal/ServiceHub/mobile
npm install
```

### 3. Start Development Server
```bash
npm start
```

### 4. Run on Simulator

**iOS (Mac only):**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

**Web:**
```bash
npm run web
```

### 5. Or Use Expo Go App

1. Install "Expo Go" from App Store / Play Store
2. Run `npm start`
3. Scan QR code with Expo Go

---

## 📋 Project Structure

```
mobile/
├── App.tsx                          # Main entry + navigation
├── app.json                         # Expo config
├── package.json                     # Dependencies
│
└── src/
    ├── screens/                     # Screen components
    │   ├── LoginScreen.tsx          # Auth
    │   ├── HomeScreen.tsx           # Service listing
    │   ├── BookingsScreen.tsx       # Bookings
    │   ├── MessagesScreen.tsx       # Messaging
    │   └── ProfileScreen.tsx        # User profile
    │
    ├── services/
    │   └── api.ts                   # API client
    │
    ├── store/                       # State management
    │   ├── authStore.ts
    │   ├── servicesStore.ts
    │   └── bookingStore.ts
    │
    ├── types/                       # TypeScript types
    ├── utils/                       # Helpers
    └── components/                  # Reusable components
```

---

## 🎯 Features Implemented

### Authentication
- ✅ Login with email/password
- ✅ Signup (form ready)
- ✅ Persistent auth with AsyncStorage
- ✅ Logout

### Services
- ✅ List all services
- ✅ Filter by category
- ✅ Search by name
- ✅ Service details
- ✅ Ratings display

### Bookings
- ✅ View bookings
- ✅ Booking status tracking
- ✅ Booking details
- ✅ Status: requested, in_progress, completed

### Messaging
- ✅ View conversations
- ✅ Chat interface (ready)
- ✅ Message history

### Profile
- ✅ User profile display
- ✅ Account settings menu
- ✅ Logout

---

## 🔌 API Integration

All API calls through `src/services/api.ts`:

```typescript
// Auth
await api.login(email, password);
await api.register(email, password, firstName, lastName);
await api.logout();

// Services
const services = await api.listServices({ category: 'plumbing' });
const service = await api.getService(serviceId);
const nearby = await api.nearbyServices(lat, lng, radius);

// Bookings
await api.createBooking(serviceId, date, address, notes);
const bookings = await api.listBookings();

// Messages
await api.sendMessage(bookingId, receiverId, content);
const messages = await api.getMessages(bookingId);

// Reviews
await api.submitReview(bookingId, rating, title, content);

// Payments
const intent = await api.createPaymentIntent(bookingId, amount);
```

---

## 🎨 UI Features

### Navigation
- Bottom tab navigator (Services, Bookings, Messages, Profile)
- Stack navigator for detail screens
- Auth flow with login guard

### Screens

| Screen | Purpose | Features |
|--------|---------|----------|
| **Login** | User authentication | Demo credentials shown |
| **Home** | Service discovery | Search, filter, list |
| **Bookings** | Booking management | Status tracking |
| **Messages** | Real-time chat | Conversation list |
| **Profile** | User settings | Account info, logout |

### Colors
- Primary: `#007AFF` (iOS Blue)
- Destructive: `#FF3B30` (Red)
- Text Dark: `#333`
- Text Light: `#999`

---

## 📱 Demo Credentials

**Email**: john@test.com  
**Password**: pass123

These are automatically filled in the login form.

---

## 🔧 Configuration

### Update API URL

Edit `src/services/api.ts`:

```typescript
// For local development
const API_URL = 'http://localhost:8080/api/v1';

// For local network (physical device)
const API_URL = 'http://192.168.1.100:8080/api/v1';

// For production
const API_URL = 'https://api.servicehub.com/api/v1';
```

---

## 📦 Building for Release

### iOS (Mac Only)

```bash
# Build for App Store
npm run build:ios

# This creates a .ipa file ready for App Store Connect
```

**Requirements:**
- Apple Developer Account
- Provisioning profiles
- Certificates

### Android

```bash
# Build for Google Play
npm run build:android

# This creates an .aab file ready for Google Play Console
```

**Requirements:**
- Google Play Developer Account
- Keystore file

---

## 🧪 Testing

### Manual Testing Flow

1. **Login**
   - Email: john@test.com
   - Password: pass123

2. **Home Screen**
   - See list of 2 services
   - Filter by category
   - Search by service name

3. **Bookings**
   - View 1 test booking
   - See status "completed"

4. **Messages**
   - View conversation list
   - Tap to open chat

5. **Profile**
   - See user info
   - Tap logout

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to API"

**Solution:**
```bash
# 1. Make sure backend is running
curl http://localhost:8080/health

# 2. Check IP for physical device
ifconfig | grep inet

# 3. Update API_URL in src/services/api.ts
const API_URL = 'http://YOUR_IP:8080/api/v1';

# 4. Restart dev server
npm start
```

### Issue: "Simulator is slow"

**Solution:**
```bash
# For iOS
xcrun simctl erase all

# For Android
emulator -avd <name> -wipe-data
```

### Issue: "Module not found"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue: "Port 19000 in use"

**Solution:**
```bash
lsof -ti:19000 | xargs kill -9
npm start
```

---

## 🚀 Next Steps to Enhance App

### Short Term (1-2 weeks)
- [ ] Add map view for nearby services
- [ ] Implement booking creation form
- [ ] Add image uploads
- [ ] Implement real-time chat
- [ ] Add push notifications

### Medium Term (2-4 weeks)
- [ ] Stripe payment integration
- [ ] Provider dashboard
- [ ] Review submission form
- [ ] Advanced filtering
- [ ] Favorites/saved services

### Long Term (1-2 months)
- [ ] Admin app
- [ ] Analytics dashboard
- [ ] Video call support
- [ ] Social features
- [ ] App store submission

---

## 📚 Useful Commands

```bash
# Development
npm start              # Start dev server
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm run web           # Run on web browser

# Testing
npm test              # Run tests
npm test -- --watch  # Run tests in watch mode

# Production
npm run build:ios     # Build for iOS
npm run build:android # Build for Android
npm run submit        # Submit to app stores

# Cleanup
npm cache clean --force    # Clear npm cache
rm -rf node_modules        # Remove dependencies
npm install                # Reinstall

# Debugging
expo logs              # View live logs
expo prebuild          # Generate native files
```

---

## 🎓 Learning Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Axios](https://axios-http.com/)

---

## ✅ Checklist Before Deployment

- [ ] Update API_URL to production
- [ ] Test on real device (iOS)
- [ ] Test on real device (Android)
- [ ] Update app version in app.json
- [ ] Add app icons (192x192 & 512x512)
- [ ] Add splash screen
- [ ] Test all navigation flows
- [ ] Test API integration
- [ ] Handle loading states
- [ ] Error messages user-friendly
- [ ] Privacy policy written
- [ ] Terms of service written

---

## 🎉 You're Ready!

Your React Native mobile app is ready for development. Run `npm start` and begin building amazing features!

**Pro Tip**: Use Expo Snack (https://snack.expo.dev) to test small code changes instantly.


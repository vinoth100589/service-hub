# ServiceHub Mobile App

React Native mobile application for iOS and Android built with Expo.

## Features

✅ User Authentication (Login/Register)  
✅ Service Listing with Filtering  
✅ Service Categories  
✅ Booking Management  
✅ Real-time Messaging  
✅ Profile Management  
✅ Bottom Tab Navigation  

## Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Language**: TypeScript

## Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator

## Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

## Running the App

### Development Mode

```bash
# Start the dev server
npm start

# Run on iOS simulator (Mac)
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

### Scan with Expo App

1. Install Expo Go app on your phone (iOS App Store or Google Play)
2. Run `npm start`
3. Scan the QR code with Expo Go

## Project Structure

```
mobile/
├── App.tsx                 # Main entry point with navigation
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── src/
    ├── screens/           # Screen components
    │   ├── LoginScreen.tsx
    │   ├── HomeScreen.tsx
    │   ├── BookingsScreen.tsx
    │   ├── MessagesScreen.tsx
    │   └── ProfileScreen.tsx
    ├── services/          # API integration
    │   └── api.ts
    ├── store/             # Zustand stores
    │   ├── authStore.ts
    │   ├── servicesStore.ts
    │   └── bookingStore.ts
    ├── types/             # TypeScript types
    ├── utils/             # Utility functions
    └── components/        # Reusable components
```

## API Configuration

Update the API URL in `src/services/api.ts`:

```typescript
const API_URL = 'http://localhost:8080/api/v1'; // Change as needed
```

For physical devices or different networks, use your machine's IP:
```typescript
const API_URL = 'http://192.168.1.100:8080/api/v1';
```

## Demo Credentials

**Email**: john@test.com  
**Password**: pass123

## Building for Production

### iOS

```bash
# Build for iOS
npm run build:ios

# Submit to App Store
npm run submit
```

### Android

```bash
# Build for Android
npm run build:android

# Submit to Google Play
npm run submit
```

## Key Screens

### 1. Login Screen
- Email/password authentication
- Registration link
- Demo credentials displayed

### 2. Home Screen (Services)
- List all available services
- Filter by category
- Search functionality
- Service cards with ratings and prices

### 3. Bookings Screen
- View all user bookings
- See booking status
- Access booking details
- Filter by status

### 4. Messages Screen
- View conversations
- Real-time messaging (ready for WebSocket)
- Message history

### 5. Profile Screen
- View user information
- Account settings
- Payment methods
- Logout

## API Integration

All API calls are handled through `src/services/api.ts`:

```typescript
// Example: List services
const response = await api.listServices({ category: 'plumbing' });

// Example: Create booking
const booking = await api.createBooking(serviceId, date, address, notes);

// Example: Send message
const message = await api.sendMessage(bookingId, receiverId, content);
```

## State Management

Using Zustand for state:

```typescript
// Example: Using auth store
const { user, isAuthenticated, login, logout } = useAuthStore();

// Example: Using services store
const { services, listServices, selectedService } = useServicesStore();
```

## Styling

Using React Native built-in `StyleSheet` for all components. Colors use a consistent blue theme:

```typescript
primaryColor: '#007AFF'
accentColor: '#FF3B30' (red for destructive)
darkText: '#333'
lightText: '#999'
```

## Error Handling

All API errors are caught and displayed to the user via Alert dialogs.

## Performance Tips

1. Use `FlatList` for large lists
2. Memoize expensive computations
3. Optimize re-renders with `useCallback`
4. Lazy load images

## Permissions

Required permissions (configured in `app.json`):

- **Location**: For nearby services search
- **Notifications**: For booking updates
- **Camera**: For profile pictures (not yet implemented)

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

### Module Not Found
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules
npm install
```

### Simulator Issues
```bash
# For iOS
xcrun simctl erase all

# For Android
emulator -avd <emulator_name> -wipe-data
```

## Next Steps

1. Implement real maps with Google Maps
2. Add image uploads for services/profile
3. Implement real-time messaging with Socket.io
4. Add push notifications
5. Implement payment processing with Stripe
6. Add provider features
7. Add admin interface

## Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)

## License

MIT

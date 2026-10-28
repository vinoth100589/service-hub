import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from './src/store/authStore';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import ServiceDetailScreen from './src/screens/ServiceDetailScreen';
import BookingFormScreen from './src/screens/BookingFormScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import BookingDetailScreen from './src/screens/BookingDetailScreen';
import ReviewFormScreen from './src/screens/ReviewFormScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DisputeFormScreen from './src/screens/DisputeFormScreen';
import BecomeProviderScreen from './src/screens/BecomeProviderScreen';
import MyServicesScreen from './src/screens/MyServicesScreen';
import ServiceFormScreen from './src/screens/ServiceFormScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import PayoutsScreen from './src/screens/PayoutsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProviderSettingsScreen from './src/screens/ProviderSettingsScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import { useNotificationStore } from './src/store/notificationStore';
import { registerForPushNotificationsAsync } from './src/services/pushNotifications';

const Stack = createStackNavigator();
const HomeStackNav = createStackNavigator();
const BookingsStackNav = createStackNavigator();
const MessagesStackNav = createStackNavigator();
const ProfileStackNav = createStackNavigator();
const Tab = createBottomTabNavigator();

function LoginStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <HomeStackNav.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStackNav.Screen name="HomeList" component={HomeScreen} />
      <HomeStackNav.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <HomeStackNav.Screen name="BookingForm" component={BookingFormScreen} />
    </HomeStackNav.Navigator>
  );
}

function BookingsStack() {
  return (
    <BookingsStackNav.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <BookingsStackNav.Screen name="BookingsList" component={BookingsScreen} />
      <BookingsStackNav.Screen name="BookingDetail" component={BookingDetailScreen} />
      <BookingsStackNav.Screen name="ReviewForm" component={ReviewFormScreen} />
      <BookingsStackNav.Screen name="Payment" component={PaymentScreen} />
      <BookingsStackNav.Screen name="DisputeForm" component={DisputeFormScreen} />
    </BookingsStackNav.Navigator>
  );
}

function MessagesStack() {
  return (
    <MessagesStackNav.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <MessagesStackNav.Screen name="MessagesList" component={MessagesScreen} />
      <MessagesStackNav.Screen name="Chat" component={ChatScreen} />
    </MessagesStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ProfileStackNav.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStackNav.Screen name="BecomeProvider" component={BecomeProviderScreen} />
      <ProfileStackNav.Screen name="MyServices" component={MyServicesScreen} />
      <ProfileStackNav.Screen name="ServiceForm" component={ServiceFormScreen} />
      <ProfileStackNav.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStackNav.Screen name="Payouts" component={PayoutsScreen} />
      <ProfileStackNav.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStackNav.Screen name="ProviderSettings" component={ProviderSettingsScreen} />
      <ProfileStackNav.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <ProfileStackNav.Screen name="Favorites" component={FavoritesScreen} />
    </ProfileStackNav.Navigator>
  );
}

function MainTabs() {
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    registerForPushNotificationsAsync();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Services',
          tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color }} />,
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsStack}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color }} />,
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color }} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color }} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, isInitializing, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={LoginStack} />
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

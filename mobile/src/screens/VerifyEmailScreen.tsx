import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function VerifyEmailScreen({ navigation, route }: any) {
  const [token, setToken] = useState(route?.params?.token || '');
  const [isLoading, setIsLoading] = useState(false);
  const { user, getCurrentUser } = useAuthStore();

  const handleVerify = async () => {
    if (!token) {
      Alert.alert('Verification code required', 'Paste the token from your verification link.');
      return;
    }
    setIsLoading(true);
    try {
      await api.verifyEmail(token);
      await getCurrentUser(); // refreshes user.verified_email
      Alert.alert('Email verified', 'Your email address is now verified.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Verification failed', err?.response?.data?.error || 'Please request a new link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!user?.email) return;
    setIsLoading(true);
    try {
      const result = await api.resendVerification(user.email);
      if (result.dev_verify_link) {
        const newToken = new URL(result.dev_verify_link).searchParams.get('token');
        if (newToken) setToken(newToken);
        Alert.alert('Verification link ready', 'A fresh link was generated — token filled in below.');
      } else {
        Alert.alert('Email sent', 'Check your inbox for a new verification link.');
      }
    } catch (err: any) {
      Alert.alert('Something went wrong', err?.response?.data?.error || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>‹ Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>
        {user?.email ? `We sent a verification link to ${user.email}.` : 'Enter the token from your verification link.'}
      </Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Verification token"
          placeholderTextColor="#999"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify email</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleResend} disabled={isLoading}>
        <Text style={styles.link}>Resend verification email</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 28,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
});

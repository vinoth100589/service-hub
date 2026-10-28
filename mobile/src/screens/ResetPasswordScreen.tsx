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

export default function ResetPasswordScreen({ navigation, route }: any) {
  const [token, setToken] = useState(route?.params?.token || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Reset token required', 'Paste the token from your reset link.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Double-check both fields.');
      return;
    }
    setIsLoading(true);
    try {
      await api.resetPassword(token, password);
      Alert.alert('Password reset', 'You can now log in with your new password.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Reset failed', err?.response?.data?.error || 'Please request a new link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set a new password</Text>

      <View style={styles.form}>
        {!route?.params?.token && (
          <TextInput
            style={styles.input}
            placeholder="Reset token (from email link)"
            placeholderTextColor="#999"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            editable={!isLoading}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="New password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Reset password</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Back to login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    color: '#333',
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
    marginTop: 20,
  },
});

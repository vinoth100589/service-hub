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
import { useAuthStore } from '../store/authStore';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('john@test.com');
  const [password, setPassword] = useState('password123');
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    try {
      // No explicit navigation here: App() swaps LoginStack for MainTabs
      // automatically once isAuthenticated flips true in the auth store.
      await login(email, password);
    } catch (err) {
      Alert.alert('Login Failed', error || 'Please try again');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ServiceHub</Text>
      <Text style={styles.subtitle}>Book services instantly</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>

      <View style={styles.demoInfo}>
        <Text style={styles.demoText}>Demo Credentials:</Text>
        <Text style={styles.demoText}>Email: john@test.com</Text>
        <Text style={styles.demoText}>Password: password123</Text>
      </View>
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
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
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#FF3B30',
    marginBottom: 12,
    textAlign: 'center',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 20,
  },
  demoInfo: {
    marginTop: 40,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});

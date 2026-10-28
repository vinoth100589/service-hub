import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const CATEGORIES = ['plumbing', 'electrical', 'cleaning'];

export default function BecomeProviderScreen({ navigation }: any) {
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { getCurrentUser } = useAuthStore();

  const handleSubmit = async () => {
    if (!businessName.trim()) {
      Alert.alert('Business name required', 'Tell customers what to call your business.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Pick a category', 'Choose the main service category you offer.');
      return;
    }

    setSubmitting(true);
    try {
      await api.applyAsProvider(businessName.trim(), description.trim());
      // Backend grants provider access immediately but bakes user_type into the
      // JWT at login time, so a stale token still reads 'customer' until we
      // refresh the session here.
      await getCurrentUser();
      Alert.alert(
        'Application submitted',
        'Your provider account is pending verification, but you can start adding services now.',
        [{ text: 'OK', onPress: () => navigation.navigate('MyServices') }]
      );
    } catch (err: any) {
      Alert.alert('Could not submit', err?.response?.data?.error || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>‹ Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Become a Provider</Text>
      <Text style={styles.subtitle}>List your services and start getting bookings</Text>

      <Text style={styles.label}>Business name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Mike's Plumbing"
        value={businessName}
        onChangeText={setBusinessName}
        editable={!submitting}
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.descInput]}
        placeholder="Tell customers about your experience"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        editable={!submitting}
      />

      <Text style={styles.label}>Main category</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Application</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  descInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
  },
  categoryChipText: {
    color: '#007AFF',
    fontSize: 14,
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 28,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

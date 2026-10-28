import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';

const CATEGORIES = ['plumbing', 'electrical', 'cleaning'];
const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function ProviderSettingsScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [responseTime, setResponseTime] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const [hours, setHours] = useState<Record<string, string>>({});
  const [savingAvailability, setSavingAvailability] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getProviderProfile();
      const data = response.data;
      setBusinessName(data.business_name || '');
      setBusinessDescription(data.business_description || '');
      setCategories(data.service_categories || []);
      setResponseTime(data.response_time_minutes ? String(data.response_time_minutes) : '');
      setHours(data.availability || {});
    } catch (err: any) {
      Alert.alert('Could not load', err?.response?.data?.error || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const toggleCategory = (cat: string) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const handleSaveSettings = async () => {
    if (!businessName.trim()) {
      Alert.alert('Missing info', 'Business name is required.');
      return;
    }
    setSavingSettings(true);
    try {
      await api.updateProviderSettings({
        business_name: businessName.trim(),
        business_description: businessDescription.trim(),
        service_categories: categories,
        response_time_minutes: responseTime ? parseInt(responseTime, 10) : undefined,
      });
      Alert.alert('Saved', 'Your provider settings were updated.');
    } catch (err: any) {
      Alert.alert('Could not save', err?.response?.data?.error || 'Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleDay = (day: string) => {
    setHours((prev) => {
      const next = { ...prev };
      if (next[day] !== undefined) {
        delete next[day];
      } else {
        next[day] = '9:00 AM - 5:00 PM';
      }
      return next;
    });
  };

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    try {
      await api.updateAvailability(hours as any);
      Alert.alert('Saved', 'Your availability was updated.');
    } catch (err: any) {
      Alert.alert('Could not save', err?.response?.data?.error || 'Please try again.');
    } finally {
      setSavingAvailability(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>‹ Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Provider Settings</Text>

      <Text style={styles.label}>Business name</Text>
      <TextInput
        style={styles.input}
        value={businessName}
        onChangeText={setBusinessName}
        editable={!savingSettings}
      />

      <Text style={styles.label}>Business description</Text>
      <TextInput
        style={[styles.input, styles.descInput]}
        value={businessDescription}
        onChangeText={setBusinessDescription}
        multiline
        numberOfLines={4}
        editable={!savingSettings}
      />

      <Text style={styles.label}>Service categories</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, categories.includes(cat) && styles.chipActive]}
            onPress={() => toggleCategory(cat)}
          >
            <Text style={[styles.chipText, categories.includes(cat) && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Typical response time (minutes)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 30"
        value={responseTime}
        onChangeText={setResponseTime}
        keyboardType="number-pad"
        editable={!savingSettings}
      />

      <TouchableOpacity
        style={[styles.saveButton, savingSettings && styles.saveButtonDisabled]}
        onPress={handleSaveSettings}
        disabled={savingSettings}
      >
        {savingSettings ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Settings</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Weekly Availability</Text>
      {DAYS.map(({ key, label }) => (
        <View key={key} style={styles.dayRow}>
          <View style={styles.dayInfo}>
            <Switch value={hours[key] !== undefined} onValueChange={() => toggleDay(key)} />
            <Text style={styles.dayLabel}>{label}</Text>
          </View>
          {hours[key] !== undefined && (
            <TextInput
              style={styles.hoursInput}
              value={hours[key]}
              onChangeText={(text) => setHours((prev) => ({ ...prev, [key]: text }))}
              placeholder="9:00 AM - 5:00 PM"
            />
          )}
        </View>
      ))}

      <TouchableOpacity
        style={[styles.saveButton, savingAvailability && styles.saveButtonDisabled]}
        onPress={handleSaveAvailability}
        disabled={savingAvailability}
      >
        {savingAvailability ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Availability</Text>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 20,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    color: '#007AFF',
    fontSize: 14,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  dayRow: {
    marginBottom: 12,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
  },
  hoursInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginLeft: 50,
  },
});

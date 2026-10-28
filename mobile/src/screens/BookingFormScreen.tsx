import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { addDays, format, setHours, setMinutes } from 'date-fns';
import { useBookingStore } from '../store/bookingStore';

function quickSlot(daysFromNow: number, hour: number) {
  const base = setMinutes(setHours(addDays(new Date(), daysFromNow), hour), 0);
  return {
    label: `${daysFromNow === 0 ? 'Today' : daysFromNow === 1 ? 'Tomorrow' : format(base, 'EEE MMM d')} · ${format(base, 'h a')}`,
    iso: base.toISOString(),
  };
}

const QUICK_SLOTS = [
  quickSlot(1, 9),
  quickSlot(1, 14),
  quickSlot(2, 9),
  quickSlot(2, 14),
  quickSlot(3, 10),
];

export default function BookingFormScreen({ route, navigation }: any) {
  const { serviceId, service } = route.params;
  const { createBooking, isLoading } = useBookingStore();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!selectedSlot) {
      Alert.alert('Pick a time', 'Choose one of the available time slots.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Address required', 'Enter the service address.');
      return;
    }

    try {
      await createBooking(serviceId, selectedSlot, address.trim(), notes.trim() || undefined);
      Alert.alert('Booking requested', 'The provider will confirm shortly.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err: any) {
      Alert.alert('Booking failed', err?.response?.data?.error || 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Book {service?.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>When?</Text>
        <View style={styles.slotGrid}>
          {QUICK_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot.iso}
              style={[styles.slotChip, selectedSlot === slot.iso && styles.slotChipActive]}
              onPress={() => setSelectedSlot(slot.iso)}
            >
              <Text
                style={[styles.slotChipText, selectedSlot === slot.iso && styles.slotChipTextActive]}
              >
                {slot.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Service address</Text>
        <TextInput
          style={styles.input}
          placeholder="123 Main St, New York, NY"
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Anything the provider should know?"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        {service?.base_price != null && (
          <View style={styles.priceSummary}>
            <Text style={styles.priceSummaryLabel}>Estimated price</Text>
            <Text style={styles.priceSummaryValue}>${service.base_price}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Request Booking</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
  },
  slotChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  slotChipText: {
    fontSize: 13,
    color: '#333',
  },
  slotChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    padding: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  priceSummaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceSummaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  submitButton: {
    marginTop: 24,
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

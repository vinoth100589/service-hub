import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useBookingStore } from '../store/bookingStore';

export default function BookingsScreen({ navigation }: any) {
  const { bookings, isLoading, listBookings } = useBookingStore();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    await listBookings();
  };

  const renderBooking = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Booking #{item.id.slice(0, 8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.date}>{new Date(item.scheduled_date).toLocaleDateString()}</Text>
      <Text style={styles.address} numberOfLines={1}>{item.service_address}</Text>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'in_progress':
        return '#FF9500';
      case 'requested':
        return '#007AFF';
      default:
        return '#999';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>My Bookings</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No bookings yet</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.emptyLink}>Browse services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 20,
    color: '#333',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#999',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 12,
  },
  emptyLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
});

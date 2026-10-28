import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useBookingStore } from '../store/bookingStore';

function statusColor(status: string) {
  switch (status) {
    case 'completed':
      return '#34C759';
    case 'in_progress':
      return '#FF9500';
    case 'accepted':
      return '#5856D6';
    case 'requested':
    case 'pending':
      return '#007AFF';
    case 'cancelled':
    case 'rejected':
      return '#8E8E93';
    default:
      return '#999';
  }
}

export default function BookingDetailScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const {
    currentBooking,
    isLoading,
    getBooking,
    acceptBooking,
    rejectBooking,
    completeBooking,
    cancelBooking,
  } = useBookingStore();

  useEffect(() => {
    getBooking(bookingId);
  }, [bookingId]);

  const withConfirm = (title: string, message: string, action: () => Promise<void>) => {
    Alert.alert(title, message, [
      { text: 'Not now', style: 'cancel' },
      {
        text: title,
        style: 'destructive',
        onPress: async () => {
          try {
            await action();
          } catch (err: any) {
            Alert.alert('Failed', err?.response?.data?.error || 'Please try again.');
          }
        },
      },
    ]);
  };

  if (isLoading || !currentBooking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const b = currentBooking;
  const isProvider = b.viewer_role === 'provider';
  const isCustomer = b.viewer_role === 'customer';
  const otherUserId = isCustomer ? b.provider_user_id : b.user_id;
  const otherUserName = isCustomer
    ? b.business_name
    : `${b.customer_first_name || ''} ${b.customer_last_name || ''}`.trim();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.serviceName}>{b.name || 'Service'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(b.status) }]}>
            <Text style={styles.statusText}>{b.status}</Text>
          </View>
        </View>

        <Text style={styles.otherParty}>
          {isCustomer ? 'Provider' : 'Customer'}: {otherUserName || '—'}
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Scheduled</Text>
          <Text style={styles.infoValue}>{new Date(b.scheduled_date).toLocaleString()}</Text>

          <Text style={styles.infoLabel}>Address</Text>
          <Text style={styles.infoValue}>{b.service_address}</Text>

          {!!b.notes && (
            <>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{b.notes}</Text>
            </>
          )}
        </View>

        {otherUserId && (
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() =>
              navigation.navigate('Messages', {
                screen: 'Chat',
                params: {
                  bookingId: b.id,
                  otherUserId,
                  otherUserName,
                  serviceName: b.name,
                },
              })
            }
          >
            <Text style={styles.messageButtonText}>💬 Message {isCustomer ? 'Provider' : 'Customer'}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.actions}>
          {isProvider && b.status === 'requested' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => acceptBooking(b.id)}
              >
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() =>
                  withConfirm('Reject booking', 'Decline this request?', () => rejectBooking(b.id))
                }
              >
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}

          {isProvider && b.status === 'accepted' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => completeBooking(b.id)}
            >
              <Text style={styles.actionButtonText}>Mark Completed</Text>
            </TouchableOpacity>
          )}

          {isCustomer && b.status === 'accepted' && b.base_price != null && (
            <TouchableOpacity
              style={[styles.actionButton, styles.payButton]}
              onPress={() =>
                navigation.navigate('Payment', {
                  bookingId: b.id,
                  amount: b.base_price,
                  serviceName: b.name,
                })
              }
            >
              <Text style={styles.actionButtonText}>💳 Pay ${b.base_price}</Text>
            </TouchableOpacity>
          )}

          {isCustomer && (b.status === 'requested' || b.status === 'accepted') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() =>
                withConfirm('Cancel booking', 'Are you sure you want to cancel?', () => cancelBooking(b.id))
              }
            >
              <Text style={styles.actionButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}

          {isCustomer && b.status === 'completed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reviewButton]}
              onPress={() =>
                navigation.navigate('ReviewForm', { bookingId: b.id, serviceName: b.name })
              }
            >
              <Text style={styles.actionButtonText}>⭐ Leave a Review</Text>
            </TouchableOpacity>
          )}

          {['in_progress', 'completed', 'accepted'].includes(b.status) && (
            <TouchableOpacity
              style={styles.disputeButton}
              onPress={() =>
                navigation.navigate('DisputeForm', { bookingId: b.id, serviceName: b.name })
              }
            >
              <Text style={styles.disputeButtonText}>Report an Issue</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 22,
    fontWeight: 'bold',
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
  otherParty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginTop: 10,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  messageButton: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    marginBottom: 20,
  },
  messageButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  reviewButton: {
    backgroundColor: '#FF9500',
  },
  payButton: {
    backgroundColor: '#007AFF',
  },
  disputeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  disputeButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNotificationStore } from '../store/notificationStore';

const TYPE_ICONS: Record<string, string> = {
  booking_requested: '📅',
  booking_accepted: '✅',
  booking_rejected: '❌',
  booking_completed: '🎉',
  booking_cancelled: '🚫',
  message_received: '💬',
  review_posted: '⭐',
  payment_received: '💳',
};

export default function NotificationsScreen({ navigation }: any) {
  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationStore();

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const renderNotification = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.card, !item.is_read && styles.cardUnread]}
      onPress={() => !item.is_read && markAsRead(item.id)}
    >
      <Text style={styles.icon}>{TYPE_ICONS[item.type] || '🔔'}</Text>
      <View style={styles.cardContent}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifContent} numberOfLines={2}>
          {item.content}
        </Text>
        <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 90 }} />
        )}
      </View>

      {isLoading && notifications.length === 0 ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>You're all caught up</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
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
    fontSize: 15,
    color: '#999',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    padding: 14,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardUnread: {
    backgroundColor: '#EAF3FF',
    borderColor: '#CCE3FF',
  },
  icon: {
    fontSize: 22,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  notifContent: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 11,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    marginTop: 6,
  },
});

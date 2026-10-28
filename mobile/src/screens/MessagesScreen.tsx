import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';

interface Conversation {
  id: string;
  other_user_id?: string;
  other_user_name?: string;
  name?: string;
  last_message?: string;
  last_message_time?: string;
}

export default function MessagesScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await api.getConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('Chat', {
          bookingId: item.id,
          otherUserId: item.other_user_id,
          otherUserName: item.other_user_name,
          serviceName: item.name,
        })
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>{item.other_user_name || 'Service Provider'}</Text>
        <Text style={styles.message} numberOfLines={1}>
          {item.last_message || 'No messages yet'}
        </Text>
      </View>
      <Text style={styles.time}>
        {item.last_message_time ? new Date(item.last_message_time).toLocaleDateString() : ''}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Messages</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No conversations yet</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
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
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#999',
  },
  time: {
    fontSize: 12,
    color: '#ccc',
    marginLeft: 12,
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
  },
  listContent: {
    paddingBottom: 20,
  },
});

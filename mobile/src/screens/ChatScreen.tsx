import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  first_name?: string;
}

const POLL_INTERVAL_MS = 4000;

export default function ChatScreen({ route, navigation }: any) {
  const { bookingId, otherUserId, otherUserName, serviceName } = route.params;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadMessages(true);
    pollRef.current = setInterval(() => loadMessages(false), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [bookingId]);

  const loadMessages = async (showLoader: boolean) => {
    if (showLoader) setIsLoading(true);
    try {
      const response = await api.getMessages(bookingId);
      setMessages(response.data || []);
    } catch (err) {
      // Silent on background polls; loud on initial load
      if (showLoader) {
        // no-op, keep prior state empty
      }
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || !otherUserId) return;

    setSending(true);
    setInputText('');
    try {
      await api.sendMessage(bookingId, otherUserId, content);
      await loadMessages(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.content}</Text>
          <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>{otherUserName || 'Conversation'}</Text>
          {serviceName && <Text style={styles.headerSubtitle}>{serviceName}</Text>}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : messages.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No messages yet — say hello!</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 4,
  },
  headerTitleBlock: {
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
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
    fontSize: 14,
    color: '#999',
  },
  listContent: {
    padding: 16,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  bubbleMine: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: '#333',
  },
  bubbleTextMine: {
    color: '#fff',
  },
  bubbleTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

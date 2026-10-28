import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';

interface Payout {
  id: string;
  name?: string;
  amount: number;
  fee_amount: number;
  provider_payout_amount: number;
  status: string;
  processed_at?: string;
}

export default function PayoutsScreen({ navigation }: any) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadPayouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getPayouts();
      setPayouts(response.data);
      setTotalEarnings(response.total_earnings || 0);
    } catch (err: any) {
      Alert.alert('Error', 'Could not load payout history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPayouts();
    }, [loadPayouts])
  );

  const renderPayout = ({ item }: { item: Payout }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.serviceName}>{item.name || 'Service'}</Text>
        <Text style={styles.payoutAmount}>+${item.provider_payout_amount}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.subtext}>
          Total ${item.amount} · Platform fee ${item.fee_amount}
        </Text>
        <Text style={styles.subtext}>
          {item.processed_at ? new Date(item.processed_at).toLocaleDateString() : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Earnings</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total earned</Text>
        <Text style={styles.summaryValue}>${totalEarnings.toFixed(2)}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : payouts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No completed payouts yet</Text>
        </View>
      ) : (
        <FlatList
          data={payouts}
          renderItem={renderPayout}
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
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.85,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
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
    marginBottom: 10,
    padding: 14,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  payoutAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#34C759',
  },
  subtext: {
    fontSize: 12,
    color: '#999',
  },
});

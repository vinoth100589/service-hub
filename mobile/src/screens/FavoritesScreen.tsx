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

interface Favorite {
  favorite_id: string;
  provider_id: string;
  business_name?: string;
  average_rating?: number;
  total_reviews?: number;
  verification_status?: string;
  first_name?: string;
  last_name?: string;
}

export default function FavoritesScreen({ navigation }: any) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.listFavorites();
      setFavorites(response.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load your saved providers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const handleRemove = async (providerId: string) => {
    setRemovingId(providerId);
    try {
      await api.removeFavorite(providerId);
      setFavorites((prev) => prev.filter((f) => f.provider_id !== providerId));
    } catch (err) {
      Alert.alert('Error', 'Could not remove this provider.');
    } finally {
      setRemovingId(null);
    }
  };

  const renderItem = ({ item }: { item: Favorite }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.businessName}>{item.business_name || 'Provider'}</Text>
        <Text style={styles.ownerName}>
          {item.first_name} {item.last_name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.rating}>⭐ {item.average_rating ?? '—'}</Text>
          <Text style={styles.reviewCount}>({item.total_reviews ?? 0} reviews)</Text>
          {item.verification_status === 'verified' && (
            <Text style={styles.verifiedBadge}>Verified</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleRemove(item.provider_id)}
        disabled={removingId === item.provider_id}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {removingId === item.provider_id ? (
          <ActivityIndicator size="small" color="#FF3B30" />
        ) : (
          <Text style={styles.removeIcon}>♥</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Saved Providers</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : favorites.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No saved providers yet</Text>
          <Text style={styles.emptySubtext}>Tap the heart on a service to save its provider here.</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.favorite_id}
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
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bbb',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 14,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  verifiedBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34C759',
  },
  removeIcon: {
    fontSize: 22,
    color: '#FF3B30',
    marginLeft: 10,
  },
});

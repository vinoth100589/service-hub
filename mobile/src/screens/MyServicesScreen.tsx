import React, { useCallback, useEffect, useState } from 'react';
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

interface MyService {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  is_active: boolean;
  rating: number;
  review_count: number;
}

export default function MyServicesScreen({ navigation }: any) {
  const [services, setServices] = useState<MyService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getMyServices();
      setServices(response.data);
    } catch (err: any) {
      Alert.alert('Error', 'Could not load your services.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices])
  );

  const handleToggleActive = async (service: MyService) => {
    try {
      if (service.is_active) {
        await api.deleteService(service.id);
      } else {
        await api.updateService(service.id, { is_active: true });
      }
      loadServices();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not update service.');
    }
  };

  const renderService = ({ item }: { item: MyService }) => (
    <TouchableOpacity
      style={[styles.card, !item.is_active && styles.cardInactive]}
      onPress={() => navigation.navigate('ServiceForm', { service: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <View style={[styles.statusBadge, item.is_active ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={styles.statusBadgeText}>{item.is_active ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      <Text style={styles.serviceDesc} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.price}>${item.base_price}</Text>
        <Text style={styles.rating}>
          ⭐ {item.rating || 0} ({item.review_count || 0})
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.toggleButton, item.is_active ? styles.deactivateButton : styles.activateButton]}
        onPress={() => handleToggleActive(item)}
      >
        <Text style={styles.toggleButtonText}>
          {item.is_active ? 'Deactivate' : 'Reactivate'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Services</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('ServiceForm', {})}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : services.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>You haven't added any services yet</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ServiceForm', {})}>
            <Text style={styles.emptyLink}>Add your first service</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderService}
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
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
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
    marginBottom: 12,
  },
  emptyLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activeBadge: {
    backgroundColor: '#34C759',
  },
  inactiveBadge: {
    backgroundColor: '#8E8E93',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  serviceDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  rating: {
    fontSize: 13,
    color: '#666',
  },
  toggleButton: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activateButton: {
    backgroundColor: '#34C759',
  },
  deactivateButton: {
    backgroundColor: '#FF3B30',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

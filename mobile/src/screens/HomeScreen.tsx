import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import * as Location from 'expo-location';
import { useServicesStore } from '../store/servicesStore';
import { useAuthStore } from '../store/authStore';

type SortOption = 'newest' | 'best' | 'price-low' | 'price-high' | 'nearest';
type QualityTier = 'good' | 'medium' | 'low';
type PriceTier = 'low' | 'medium' | 'high';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'best', label: 'Best' },
  { key: 'price-low', label: 'Price: Low→High' },
  { key: 'price-high', label: 'Price: High→Low' },
  { key: 'nearest', label: 'Nearest' },
];

const QUALITY_OPTIONS: { key: QualityTier; label: string }[] = [
  { key: 'good', label: 'Good' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

const PRICE_TIER_OPTIONS: { key: PriceTier; label: string }[] = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
];

function qualityBadgeStyle(tier: QualityTier) {
  switch (tier) {
    case 'good':
      return styles.qualityGood;
    case 'medium':
      return styles.qualityMedium;
    case 'low':
      return styles.qualityLow;
  }
}

export default function HomeScreen({ navigation }: any) {
  const { services, categories, isLoading, listServices, nearbyServices, getCategories } =
    useServicesStore();
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [qualityTier, setQualityTier] = useState<QualityTier | null>(null);
  const [priceTier, setPriceTier] = useState<PriceTier | null>(null);
  const [searchText, setSearchText] = useState('');
  const [locating, setLocating] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getCategories();
  }, []);

  const applyFilters = useCallback(
    async (overrides?: {
      category?: string | null;
      sortBy?: SortOption;
      q?: string;
      qualityTier?: QualityTier | null;
      priceTier?: PriceTier | null;
    }) => {
      const category = overrides?.category !== undefined ? overrides.category : selectedCategory;
      const sort = overrides?.sortBy !== undefined ? overrides.sortBy : sortBy;
      const q = overrides?.q !== undefined ? overrides.q : searchText;
      const quality = overrides?.qualityTier !== undefined ? overrides.qualityTier : qualityTier;
      const price = overrides?.priceTier !== undefined ? overrides.priceTier : priceTier;

      if (sort === 'nearest') {
        setLocating(true);
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Location needed', 'Enable location access to find services near you.');
            setLocating(false);
            return;
          }
          const position = await Location.getCurrentPositionAsync({});
          await nearbyServices(position.coords.latitude, position.coords.longitude);
        } catch (err) {
          Alert.alert('Location error', 'Could not determine your location.');
        } finally {
          setLocating(false);
        }
        return;
      }

      await listServices({
        category: category || undefined,
        q: q || undefined,
        sortBy: sort,
        qualityTier: quality || undefined,
        priceTier: price || undefined,
      });
    },
    [selectedCategory, sortBy, searchText, qualityTier, priceTier, listServices, nearbyServices]
  );

  useEffect(() => {
    applyFilters();
  }, []);

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    applyFilters({ category });
  };

  const handleSort = (sort: SortOption) => {
    setSortBy(sort);
    applyFilters({ sortBy: sort });
  };

  const handleQualityFilter = (tier: QualityTier) => {
    const next = qualityTier === tier ? null : tier;
    setQualityTier(next);
    applyFilters({ qualityTier: next });
  };

  const handlePriceTierFilter = (tier: PriceTier) => {
    const next = priceTier === tier ? null : tier;
    setPriceTier(next);
    applyFilters({ priceTier: next });
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applyFilters({ q: text });
    }, 400);
  };

  const clearAdvancedFilters = () => {
    setSortBy('newest');
    setQualityTier(null);
    setPriceTier(null);
    applyFilters({ sortBy: 'newest', qualityTier: null, priceTier: null });
  };

  const activeFilterCount =
    (sortBy !== 'newest' ? 1 : 0) + (qualityTier ? 1 : 0) + (priceTier ? 1 : 0);

  const renderServiceCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ServiceDetail', { serviceId: item.id })}
    >
      <View style={styles.cardContent}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.serviceDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.price}>${item.base_price}</Text>
          <View style={styles.metaRow}>
            {item.distance_km != null && (
              <Text style={styles.distanceText}>{item.distance_km} km</Text>
            )}
            <Text style={styles.ratingText}>⭐ {item.rating}</Text>
          </View>
        </View>
        {(item.quality_tier || item.price_tier) && (
          <View style={styles.tierRow}>
            {item.quality_tier && (
              <View style={[styles.tierBadge, qualityBadgeStyle(item.quality_tier)]}>
                <Text style={styles.tierBadgeText}>{item.quality_tier} quality</Text>
              </View>
            )}
            {item.price_tier && (
              <View style={[styles.tierBadge, styles.priceBadge]}>
                <Text style={styles.tierBadgeText}>{item.price_tier} price</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {user?.first_name}!</Text>
        <Text style={styles.subtitle}>Find services near you</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search services, categories, providers..."
          value={searchText}
          onChangeText={handleSearchChange}
        />
        <TouchableOpacity
          style={[styles.filtersButton, activeFilterCount > 0 && styles.filtersButtonActive]}
          onPress={() => setFiltersOpen(true)}
        >
          <Text
            style={[
              styles.filtersButtonText,
              activeFilterCount > 0 && styles.filtersButtonTextActive,
            ]}
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => handleCategoryFilter(null)}
        >
          <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => handleCategoryFilter(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading || locating ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : services.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No services match your filters</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={true}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={filtersOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFiltersOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setFiltersOpen(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <TouchableOpacity onPress={clearAdvancedFilters}>
                <Text style={styles.sheetClear}>Clear all</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetLabel}>Sort by</Text>
            <View style={styles.chipWrap}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.sortChip, sortBy === opt.key && styles.sortChipActive]}
                  onPress={() => handleSort(opt.key)}
                >
                  <Text style={[styles.sortText, sortBy === opt.key && styles.sortTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sheetLabel}>Quality</Text>
            <View style={styles.chipWrap}>
              {QUALITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.tierChip, qualityTier === opt.key && styles.tierChipActive]}
                  onPress={() => handleQualityFilter(opt.key)}
                >
                  <Text
                    style={[styles.tierChipText, qualityTier === opt.key && styles.tierChipTextActive]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sheetLabel}>Price</Text>
            <View style={styles.chipWrap}>
              {PRICE_TIER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.tierChip, priceTier === opt.key && styles.tierChipActive]}
                  onPress={() => handlePriceTierFilter(opt.key)}
                >
                  <Text
                    style={[styles.tierChipText, priceTier === opt.key && styles.tierChipTextActive]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.sheetDoneButton} onPress={() => setFiltersOpen(false)}>
              <Text style={styles.sheetDoneButtonText}>Show results</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#007AFF',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 14,
    marginRight: 8,
  },
  filtersButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  filtersButtonActive: {
    backgroundColor: '#007AFF',
  },
  filtersButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  filtersButtonTextActive: {
    color: '#fff',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    marginBottom: 12,
    maxHeight: 45,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  tierRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  qualityGood: {
    backgroundColor: '#34C759',
  },
  qualityMedium: {
    backgroundColor: '#FF9500',
  },
  qualityLow: {
    backgroundColor: '#8E8E93',
  },
  priceBadge: {
    backgroundColor: '#5856D6',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sheetClear: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  sheetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  sortChipActive: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  sortText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#fff',
  },
  tierChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 16,
  },
  tierChipActive: {
    backgroundColor: '#007AFF',
  },
  tierChipText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '500',
  },
  tierChipTextActive: {
    color: '#fff',
  },
  sheetDoneButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  sheetDoneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../services/api';

interface Review {
  id: string;
  rating: number;
  title?: string;
  content?: string;
  helpful_count: number;
  first_name?: string;
  last_name?: string;
}

interface ServiceDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  price_unit?: string;
  rating: number;
  review_count: number;
  quality_tier?: 'good' | 'medium' | 'low';
  price_tier?: 'low' | 'medium' | 'high';
  business_name?: string;
  average_rating?: number;
  total_reviews?: number;
  verification_status?: string;
  provider_id?: string;
  provider?: { id?: string; business_name: string; average_rating: number };
  recent_reviews?: Review[];
}

export default function ServiceDetailScreen({ route, navigation }: any) {
  const { serviceId } = route.params;
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({});
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  useEffect(() => {
    loadService();
  }, [serviceId]);

  const loadService = async () => {
    setIsLoading(true);
    try {
      const response = await api.getService(serviceId);
      const data: ServiceDetail = response.data;
      setService(data);
      const counts: Record<string, number> = {};
      (data.recent_reviews || []).forEach((r) => {
        counts[r.id] = r.helpful_count;
      });
      setHelpfulCounts(counts);

      const providerId = data.provider_id || data.provider?.id;
      if (providerId) {
        try {
          const favResponse = await api.listFavorites();
          setIsFavorited(favResponse.data.some((f: any) => f.provider_id === providerId));
        } catch {
          // Non-critical — the heart just won't reflect saved state this load.
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Could not load this service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    const providerId = service?.provider_id || service?.provider?.id;
    if (!providerId || favoriteBusy) return;
    setFavoriteBusy(true);
    const wasFavorited = isFavorited;
    setIsFavorited(!wasFavorited); // optimistic
    try {
      if (wasFavorited) {
        await api.removeFavorite(providerId);
      } else {
        await api.addFavorite(providerId);
      }
    } catch (err) {
      setIsFavorited(wasFavorited); // revert on failure
      Alert.alert('Error', 'Could not update saved providers.');
    } finally {
      setFavoriteBusy(false);
    }
  };

  const handleHelpfulVote = async (reviewId: string) => {
    try {
      const response = await api.markReviewHelpful(reviewId);
      setHelpfulCounts((prev) => ({ ...prev, [reviewId]: response.data.helpful_count }));
      setVotedReviews((prev) => ({ ...prev, [reviewId]: response.data.voted }));
    } catch (err) {
      Alert.alert('Error', 'Could not register your vote.');
    }
  };

  const businessName = service?.business_name || service?.provider?.business_name;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Service not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        {(service.provider_id || service.provider?.id) && (
          <TouchableOpacity onPress={handleToggleFavorite} disabled={favoriteBusy} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.favoriteIcon}>{isFavorited ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.name}>{service.name}</Text>
        {businessName && <Text style={styles.provider}>by {businessName}</Text>}

        <View style={styles.tierRow}>
          {service.quality_tier && (
            <View style={[styles.badge, qualityBadgeStyle(service.quality_tier)]}>
              <Text style={styles.badgeText}>{service.quality_tier} quality</Text>
            </View>
          )}
          {service.price_tier && (
            <View style={[styles.badge, styles.priceBadge]}>
              <Text style={styles.badgeText}>{service.price_tier} price</Text>
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>${service.base_price}</Text>
          {service.price_unit && <Text style={styles.priceUnit}>/ {service.price_unit}</Text>}
          <Text style={styles.rating}>⭐ {service.rating} ({service.review_count} reviews)</Text>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{service.description}</Text>

        <Text style={styles.sectionTitle}>Reviews</Text>
        {(service.recent_reviews || []).length === 0 ? (
          <Text style={styles.noReviews}>No reviews yet</Text>
        ) : (
          (service.recent_reviews || []).map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>
                  {review.first_name} {review.last_name}
                </Text>
                <Text style={styles.reviewRating}>{'⭐'.repeat(review.rating)}</Text>
              </View>
              {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
              {review.content && <Text style={styles.reviewContent}>{review.content}</Text>}
              <TouchableOpacity
                style={styles.helpfulButton}
                onPress={() => handleHelpfulVote(review.id)}
              >
                <Text
                  style={[
                    styles.helpfulButtonText,
                    votedReviews[review.id] && styles.helpfulButtonTextActive,
                  ]}
                >
                  👍 Helpful ({helpfulCounts[review.id] ?? review.helpful_count})
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.bookBar}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('BookingForm', { serviceId, service })}
        >
          <Text style={styles.bookButtonText}>Book Now — ${service.base_price}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function qualityBadgeStyle(tier: 'good' | 'medium' | 'low') {
  switch (tier) {
    case 'good':
      return styles.qualityGood;
    case 'medium':
      return styles.qualityMedium;
    case 'low':
      return styles.qualityLow;
  }
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
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  favoriteIcon: {
    fontSize: 26,
    color: '#FF3B30',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  provider: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  tierRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  qualityGood: { backgroundColor: '#34C759' },
  qualityMedium: { backgroundColor: '#FF9500' },
  qualityLow: { backgroundColor: '#8E8E93' },
  priceBadge: { backgroundColor: '#5856D6' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  priceUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    marginRight: 16,
  },
  rating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 'auto',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  noReviews: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  reviewRating: {
    fontSize: 12,
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  reviewContent: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  helpfulButton: {
    alignSelf: 'flex-start',
  },
  helpfulButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  helpfulButtonTextActive: {
    color: '#007AFF',
  },
  bookBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

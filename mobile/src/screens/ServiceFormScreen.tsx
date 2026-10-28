import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';

const CATEGORIES = ['plumbing', 'electrical', 'cleaning'];
const PRICE_UNITS: { key: 'hourly' | 'flat_rate' | 'project'; label: string }[] = [
  { key: 'hourly', label: 'Hourly' },
  { key: 'flat_rate', label: 'Flat rate' },
  { key: 'project', label: 'Per project' },
];

export default function ServiceFormScreen({ route, navigation }: any) {
  const existing = route.params?.service;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [category, setCategory] = useState<string | null>(existing?.category || null);
  const [basePrice, setBasePrice] = useState(existing?.base_price ? String(existing.base_price) : '');
  const [priceUnit, setPriceUnit] = useState<'hourly' | 'flat_rate' | 'project'>(
    existing?.price_unit || 'flat_rate'
  );
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>(existing?.images || []);
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleAddImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add service photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 6,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploadingImages(true);
    try {
      const response = await api.uploadServiceImages(existing.id, result.assets.map((a) => a.uri));
      setImages(response.data.images);
    } catch (err: any) {
      Alert.alert('Upload failed', err?.response?.data?.error || 'Could not upload photos.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim() || !category || !basePrice) {
      Alert.alert('Missing info', 'Fill in all fields before saving.');
      return;
    }
    const price = parseFloat(basePrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid price', 'Enter a valid price greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await api.updateService(existing.id, {
          name: name.trim(),
          description: description.trim(),
          category,
          base_price: price,
          price_unit: priceUnit,
        });
      } else {
        await api.createService({
          name: name.trim(),
          description: description.trim(),
          category,
          base_price: price,
          price_unit: priceUnit,
        });
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not save', err?.response?.data?.error || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>‹ Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isEditing ? 'Edit Service' : 'New Service'}</Text>

      <Text style={styles.label}>Service name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Pipe Repair"
        value={name}
        onChangeText={setName}
        editable={!submitting}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.descInput]}
        placeholder="What does this service include?"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        editable={!submitting}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Price unit</Text>
      <View style={styles.chipRow}>
        {PRICE_UNITS.map((unit) => (
          <TouchableOpacity
            key={unit.key}
            style={[styles.chip, priceUnit === unit.key && styles.chipActive]}
            onPress={() => setPriceUnit(unit.key)}
          >
            <Text style={[styles.chipText, priceUnit === unit.key && styles.chipTextActive]}>
              {unit.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Price ($)</Text>
      <TextInput
        style={styles.input}
        placeholder="150"
        value={basePrice}
        onChangeText={setBasePrice}
        keyboardType="decimal-pad"
        editable={!submitting}
      />

      {isEditing && (
        <>
          <Text style={styles.label}>Photos</Text>
          <View style={styles.photoRow}>
            {images.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.photoThumb} />
            ))}
            <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddImages} disabled={uploadingImages}>
              {uploadingImages ? (
                <ActivityIndicator color="#007AFF" size="small" />
              ) : (
                <Text style={styles.addPhotoText}>+ Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>{isEditing ? 'Save Changes' : 'Create Service'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  descInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  addPhotoButton: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addPhotoText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    color: '#007AFF',
    fontSize: 14,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 28,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

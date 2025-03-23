import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { itemsApi, Item } from '../../../../src/services/api';
import Card from '../../../../src/components/ui/Card';
import ErrorMessage from '../../../../src/components/ui/ErrorMessage';
import LoadingIndicator from '../../../../src/components/ui/LoadingIndicator';
import * as ImagePicker from 'expo-image-picker';

export default function EditInventoryItem() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [formData, setFormData] = useState<Omit<Item, '_id'>>({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    price: 0,
    description: '',
    tags: []
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      try {
        const data = await itemsApi.getById(id);
        setFormData({
          name: data.name,
          sku: data.sku,
          category: data.category,
          quantity: data.quantity,
          price: data.price,
          description: data.description || '',
          tags: data.tags || []
        });
        
        // Set image preview if available
        if (data.imageUrl) {
          setImageUri(data.imageUrl);
        }
      } catch (err) {
        console.error('Failed to fetch item:', err);
        setError('Failed to load item details. The item may have been deleted.');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    if (field === 'quantity' || field === 'price') {
      // Convert to number
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.category.trim()) return 'Category is required';
    if (formData.quantity < 0) return 'Quantity cannot be negative';
    if (formData.price < 0) return 'Price cannot be negative';
    return null;
  };

  const handleSubmit = async () => {
    if (!id) return;
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      if (imageUri && !imageUri.startsWith('http')) {  // Check if it's a newly selected image
        const formDataToSend = new FormData();
        
        // Add text fields
        Object.entries(formData).forEach(([key, value]) => {
          if (key !== 'tags') {
            formDataToSend.append(key, String(value));
          }
        });
        
        // Add tags as JSON string
        if (formData.tags && formData.tags.length > 0) {
          formDataToSend.append('tags', JSON.stringify(formData.tags));
        }
        
        // Add image file
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formDataToSend.append('image', {
          uri: imageUri,
          name: `photo.${fileType}`,
          type: `image/${fileType}`
        } as any);
        
        await itemsApi.update(id, formDataToSend);
      } else {
        // No new image, just send JSON
        await itemsApi.update(id, formData);
      }
      
      Alert.alert('Success', 'Item was updated successfully');
      router.replace(`/inventory/${id}`);
    } catch (err) {
      console.error('Failed to update item:', err);
      setError('Failed to update item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'You need to grant permission to access your photo library');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Item</Text>
        <Link href={`/inventory/${id}`} asChild>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={18} color="#0a7ea4" />
            <Text style={styles.backButtonText}>Back to Details</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {error && <ErrorMessage message={error} />}

      <Card>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Item Image</Text>
          <View style={styles.imageContainer}>
            {imageUri ? (
              <View style={styles.selectedImageContainer}>
                <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton} 
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#cc0000" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                <Ionicons name="camera" size={40} color="#757575" />
                <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Item name"
            editable={!saving}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>SKU</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={formData.sku}
            editable={false}
          />
          <Text style={styles.helperText}>SKU cannot be changed after creation</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category *</Text>
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(value) => handleChange('category', value)}
            placeholder="Item category"
            editable={!saving}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              value={formData.quantity.toString()}
              onChangeText={(value) => handleChange('quantity', value)}
              keyboardType="number-pad"
              placeholder="0"
              editable={!saving}
            />
          </View>

          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Price *</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceCurrency}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={formData.price.toString()}
                onChangeText={(value) => handleChange('price', value)}
                keyboardType="decimal-pad"
                placeholder="0.00"
                editable={!saving}
              />
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            placeholder="Item description (optional)"
            multiline
            numberOfLines={4}
            editable={!saving}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Ionicons name="save" size={18} color="white" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Update Item'}
          </Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  backButtonText: {
    color: '#0a7ea4',
    marginLeft: 4,
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#777',
  },
  helperText: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: 'white',
  },
  priceCurrency: {
    paddingLeft: 12,
    paddingRight: 4,
    fontSize: 16,
    color: '#444',
  },
  priceInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 4,
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#76b8c8',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#757575',
    fontSize: 14,
  },
  selectedImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
  },
});

import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Image,
  FlatList 
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { itemsApi, Item } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import ErrorMessage from '../../src/components/ui/ErrorMessage';

export default function NewInventoryItem() {
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
  const [currentTag, setCurrentTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof formData, value: string) => {
    if (field === 'quantity' || field === 'price') {
      // Convert to number
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleAddTag = () => {
    if (!currentTag.trim()) return;
    
    // Make sure there are no duplicates
    if (formData.tags && formData.tags.includes(currentTag.trim())) {
      setCurrentTag('');
      return;
    }
    
    const updatedTags = [...(formData.tags || []), currentTag.trim()];
    setFormData(prev => ({ ...prev, tags: updatedTags }));
    setCurrentTag('');
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    if (!formData.tags) return;
    
    const updatedTags = formData.tags.filter(tag => tag !== tagToRemove);
    setFormData(prev => ({ ...prev, tags: updatedTags }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.sku.trim()) return 'SKU is required';
    if (!formData.category.trim()) return 'Category is required';
    if (formData.quantity < 0) return 'Quantity cannot be negative';
    if (formData.price < 0) return 'Price cannot be negative';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      // If we have an image, use FormData
      if (imageUri) {
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
        
        await itemsApi.create(formDataToSend);
      } else {
        // No image, just send JSON
        await itemsApi.create(formData);
      }
      
      Alert.alert('Success', 'Item was created successfully');
      router.replace('/inventory');
    } catch (err) {
      console.error('Failed to save item:', err);
      setError('Failed to save item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Item</Text>
        <Link href="/inventory" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={18} color="#0a7ea4" />
            <Text style={styles.backButtonText}>Back to List</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {error && <ErrorMessage message={error} />}

      <Card>
        {/* Image Picker */}
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

        {/* Basic Info Fields */}
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
          <Text style={styles.label}>SKU *</Text>
          <TextInput
            style={styles.input}
            value={formData.sku}
            onChangeText={(value) => handleChange('sku', value)}
            placeholder="Stock keeping unit"
            editable={!saving}
          />
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

        {/* Tags Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={currentTag}
              onChangeText={setCurrentTag}
              placeholder="Add tags..."
              editable={!saving}
            />
            <TouchableOpacity 
              style={[styles.addTagButton, !currentTag.trim() && styles.disabledButton]} 
              onPress={handleAddTag}
              disabled={!currentTag.trim() || saving}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {formData.tags && formData.tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {formData.tags.map(tag => (
                <View key={tag} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                    <Ionicons name="close" size={16} color="#333" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.helperText}>Add tags to help organize your inventory</Text>
          )}
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              value={formData.quantity.toString()}
              onChangeText={(value) => handleChange('quantity', value)}
              keyboardType="numeric"
              editable={!saving}
            />
          </View>

          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={formData.price.toString()}
              onChangeText={(value) => handleChange('price', value)}
              keyboardType="decimal-pad"
              placeholder="0.00"
              editable={!saving}
            />
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
            {saving ? 'Saving...' : 'Save Item'}
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
    marginBottom: 16,
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
  imagePlaceholder: {
    width: '100%',
    height: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#757575',
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    borderRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  tagBadge: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
  helperText: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

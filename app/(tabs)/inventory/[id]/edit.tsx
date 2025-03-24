import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, 
  Alert, Image, Modal, FlatList 
} from 'react-native';
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
  
  // New states for category and tag management
  const [categories, setCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);

  // Load item data and category/tag suggestions
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        // Fetch item, categories, and tags in parallel
        const [data, categoriesData, tagsData] = await Promise.all([
          itemsApi.getById(id),
          itemsApi.getCategories(),
          itemsApi.getTags()
        ]);
        
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
        
        // Set categories and tags for autocomplete
        setCategories(categoriesData);
        setAllTags(tagsData);
        setFilteredCategories(categoriesData);
        setFilteredTags(tagsData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load item details. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    if (field === 'quantity' || field === 'price') {
      // Convert to number
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else if (field === 'category') {
      // Filter categories as user types
      const filtered = categories.filter(cat => 
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Tag management functions
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    // Only add if it's not already in the array
    if (!formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
    }
    
    setNewTag('');
    setTagModalVisible(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const filterTags = (text: string) => {
    const filtered = allTags.filter(tag => 
      tag.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredTags(filtered);
    setNewTag(text);
  };

  const selectCategory = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
    setCategoryModalVisible(false);
  };

  const selectTag = (tag: string) => {
    if (!formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
    }
    setNewTag('');
    setTagModalVisible(false);
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
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setCategoryModalVisible(true)}
            disabled={saving}
          >
            <View style={styles.pickerDisplayContainer}>
              <Text style={formData.category ? styles.inputText : styles.placeholderText}>
                {formData.category || "Select a category"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#757575" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Tags Section */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagsContainer}>
            {formData.tags && formData.tags.length > 0 ? (
              <View style={styles.tagChipsContainer}>
                {formData.tags.map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                      <Ionicons name="close-circle" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.placeholderText}>No tags added</Text>
            )}
            <TouchableOpacity 
              style={styles.addTagButton} 
              onPress={() => setTagModalVisible(true)}
              disabled={saving}
            >
              <Ionicons name="add" size={20} color="#0a7ea4" />
              <Text style={styles.addTagButtonText}>Add Tag</Text>
            </TouchableOpacity>
          </View>
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
      
      {/* Category Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search or enter new category"
              value={formData.category}
              onChangeText={(value) => handleChange('category', value)}
            />
            
            <FlatList
              data={filteredCategories}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.suggestionItem}
                  onPress={() => selectCategory(item)}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {formData.category ? 'No matching categories. Press "Add" to create new category.' : 'No categories available.'}
                </Text>
              }
            />
            
            {formData.category && !categories.includes(formData.category) && (
              <TouchableOpacity 
                style={styles.addNewButton}
                onPress={() => selectCategory(formData.category)}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.addNewButtonText}>Add "{formData.category}"</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Tag Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={tagModalVisible}
        onRequestClose={() => setTagModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Tag</Text>
              <TouchableOpacity onPress={() => setTagModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search or enter new tag"
              value={newTag}
              onChangeText={filterTags}
            />
            
            <FlatList
              data={filteredTags}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.suggestionItem}
                  onPress={() => selectTag(item)}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {newTag ? 'No matching tags. Press "Add" to create new tag.' : 'No tags available.'}
                </Text>
              }
            />
            
            {newTag && !allTags.includes(newTag) && (
              <TouchableOpacity 
                style={styles.addNewButton}
                onPress={handleAddTag}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.addNewButtonText}>Add "{newTag}"</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
  // New styles
  pickerDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    fontSize: 16,
    color: '#aaa',
  },
  tagsContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    backgroundColor: 'white',
  },
  tagChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e1f5fe',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipText: {
    fontSize: 14,
    marginRight: 4,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addTagButtonText: {
    color: '#0a7ea4',
    fontSize: 14,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#757575',
    fontStyle: 'italic',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  addNewButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  }
});

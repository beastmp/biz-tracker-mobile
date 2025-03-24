import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Image,
  FlatList,
  Modal 
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { itemsApi, Item } from '../../../src/services/api';
import Card from '../../../src/components/ui/Card';
import ErrorMessage from '../../../src/components/ui/ErrorMessage';

export default function NewInventoryItem() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Item>>({
    name: '',
    sku: '',
    description: '',
    price: 0,
    cost: 0,
    quantity: 0,
    category: '',
    tags: [],
    imageUrl: ''
  });
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New states for category and tag suggestions
  const [categories, setCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);

  // Fetch next SKU, categories and tags on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [nextSku, categoriesData, tagsData] = await Promise.all([
          itemsApi.getNextSku(),
          itemsApi.getCategories(),
          itemsApi.getTags()
        ]);
        
        // Set next available SKU
        setFormData(prev => ({ ...prev, sku: nextSku }));
        
        // Set categories and tags
        setCategories(categoriesData);
        setAllTags(tagsData);
        setFilteredCategories(categoriesData);
        setFilteredTags(tagsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load form data. Please check your connection.');
      }
    };
    
    fetchData();
  }, []);

  const handleChange = (field: string, value: string | number) => {
    if (field === 'category') {
      // Filter categories as user types
      const filtered = categories.filter(cat => 
        cat.toLowerCase().includes(value.toString().toLowerCase())
      );
      setFilteredCategories(filtered);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setFormData(prev => ({ ...prev, imageUrl: result.assets[0].uri }));
    }
  };

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

  const validateForm = () => {
    if (!formData.name) return 'Item name is required';
    if (!formData.sku) return 'SKU is required';
    if (formData.price === undefined || formData.price < 0) return 'Price must be a non-negative number';
    if (formData.quantity === undefined || formData.quantity < 0) return 'Quantity must be a non-negative number';
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
      await itemsApi.create(formData);
      Alert.alert(
        "Success",
        "Item created successfully",
        [{ text: "OK", onPress: () => router.replace('/inventory') }]
      );
    } catch (err) {
      console.error('Error creating item:', err);
      setError('Failed to create item. Please try again.');
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
            placeholder="Auto-generated SKU"
          />
          <Text style={styles.helperText}>Auto-generated 10-digit SKU</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
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
              value={formData.quantity?.toString()}
              onChangeText={(value) => handleChange('quantity', parseInt(value) || 0)}
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
                value={formData.price?.toString()}
                onChangeText={(value) => handleChange('price', parseFloat(value) || 0)}
                keyboardType="decimal-pad"
                placeholder="0.00"
                editable={!saving}
              />
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Cost</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceCurrency}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={formData.cost?.toString()}
                onChangeText={(value) => handleChange('cost', parseFloat(value) || 0)}
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
            {saving ? 'Saving...' : 'Create Item'}
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
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
    fontSize: 16,
    color: '#333',
  },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    borderRadius: 4,
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#76b8c8',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: 200,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#757575',
    marginTop: 8,
  },
  selectedImageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 15,
    elevation: 2,
  },
  pickerDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
  },
  inputText: {
    color: '#000',
  },
  tagsContainer: {
    marginBottom: 10,
  },
  tagChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipText: {
    marginRight: 4,
    fontSize: 14,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addTagButtonText: {
    color: '#0a7ea4',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    color: '#757575',
    fontStyle: 'italic',
  },
  addNewButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    borderRadius: 4,
    marginTop: 16,
  },
  addNewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
    description: ''
  });
  
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
      await itemsApi.create(formData);
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
});

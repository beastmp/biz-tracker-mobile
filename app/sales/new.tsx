import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Modal,
  FlatList,
  Image
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { itemsApi, salesApi, Item, Sale, SaleItem } from '../../src/services/api';
import Card from '../../src/components/ui/Card';
import ErrorMessage from '../../src/components/ui/ErrorMessage';
import LoadingIndicator from '../../src/components/ui/LoadingIndicator';

export default function NewSale() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Sale>>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    items: [],
    subtotal: 0,
    taxRate: 7.5, // Default tax rate
    taxAmount: 0,
    discountAmount: 0,
    total: 0,
    paymentMethod: 'cash',
    notes: '',
    status: 'completed'
  });
  
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<string>('1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemSelectVisible, setItemSelectVisible] = useState(false);

  // Fetch available items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const items = await itemsApi.getAll();
        setAvailableItems(items.filter(item => item.quantity > 0));
      } catch (err) {
        console.error('Failed to fetch items:', err);
        setError('Failed to load inventory items. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Recalculate totals when items, tax rate, or discount change
  useEffect(() => {
    if (!formData.items || formData.items.length === 0) {
      setFormData(prev => ({
        ...prev,
        subtotal: 0,
        taxAmount: 0,
        total: 0
      }));
      return;
    }
    
    const subtotal = formData.items.reduce(
      (sum, item) => sum + (item.quantity * item.priceAtSale), 
      0
    );
    
    const taxAmount = subtotal * ((formData.taxRate || 0) / 100);
    const total = subtotal + taxAmount - (formData.discountAmount || 0);
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total: total < 0 ? 0 : total
    }));
  }, [formData.items, formData.taxRate, formData.discountAmount]);

  const handleTextChange = (field: keyof typeof formData, value: string) => {
    if (field === 'taxRate' || field === 'discountAmount') {
      // Convert to number
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setSelectedQuantity('1');
    setItemSelectVisible(false);
  };

  const handleAddItem = () => {
    if (!selectedItem) {
      setError('Please select an item');
      return;
    }
    
    const quantity = parseInt(selectedQuantity);
    
    if (isNaN(quantity) || quantity <= 0) {
      setError('Quantity must be a positive number');
      return;
    }
    
    if (quantity > selectedItem.quantity) {
      setError(`Only ${selectedItem.quantity} items available in stock`);
      return;
    }

    const newItem: SaleItem = {
      item: selectedItem._id || '',
      quantity,
      priceAtSale: selectedItem.price
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
    
    setSelectedItem(null);
    setSelectedQuantity('1');
    setError(null);
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.items || formData.items.length === 0) {
      return 'At least one item is required';
    }
    
    if ((formData.total || 0) <= 0) {
      return 'Sale total must be greater than zero';
    }
    
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
      await salesApi.create(formData as Sale);
      Alert.alert('Success', 'Sale was created successfully');
      router.replace('/sales');
    } catch (err) {
      console.error('Failed to create sale:', err);
      setError('Failed to create sale. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getItemById = (id: string): Item | undefined => {
    return availableItems.find(item => item._id === id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Sale</Text>
        <Link href="/sales" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={18} color="#0a7ea4" />
            <Text style={styles.backButtonText}>Back to List</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {error && <ErrorMessage message={error} />}

      <Card>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.divider} />

        <View style={styles.formGroup}>
          <Text style={styles.label}>Customer Name</Text>
          <TextInput
            style={styles.input}
            value={formData.customerName}
            onChangeText={(value) => handleTextChange('customerName', value)}
            placeholder="Customer name (optional)"
            editable={!saving}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.customerEmail}
              onChangeText={(value) => handleTextChange('customerEmail', value)}
              placeholder="Email (optional)"
              keyboardType="email-address"
              editable={!saving}
            />
          </View>

          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.customerPhone}
              onChangeText={(value) => handleTextChange('customerPhone', value)}
              placeholder="Phone (optional)"
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Sale Items</Text>
        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.selectItemButton}
          onPress={() => setItemSelectVisible(true)}
          disabled={saving || availableItems.length === 0}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.selectItemButtonText}>
            {selectedItem ? 'Change Item' : 'Select Item'}
          </Text>
        </TouchableOpacity>

        {selectedItem && (
          <Card style={styles.selectedItemCard}>
            <View style={styles.selectedItemHeader}>
              <Text style={styles.selectedItemName}>{selectedItem.name}</Text>
              <Text style={styles.selectedItemPrice}>
                {formatCurrency(selectedItem.price)}
              </Text>
            </View>
            
            <View style={styles.selectedItemActions}>
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Quantity:</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={selectedQuantity}
                  onChangeText={setSelectedQuantity}
                  keyboardType="number-pad"
                  editable={!saving}
                />
                <Text style={styles.stockInfo}>
                  (Max: {selectedItem.quantity})
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={handleAddItem}
                disabled={saving}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.addItemButtonText}>Add to Sale</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {formData.items && formData.items.length > 0 ? (
          <View style={styles.itemsList}>
            {formData.items.map((saleItem, index) => {
              const itemDetails = typeof saleItem.item === 'object' 
                ? saleItem.item
                : getItemById(saleItem.item);
                
              return (
                <View key={index} style={styles.saleItemContainer}>
                  {/* Item Image */}
                  {itemDetails?.imageUrl ? (
                    <Image source={{ uri: itemDetails.imageUrl }} style={styles.saleItemImage} />
                  ) : (
                    <View style={styles.saleItemImagePlaceholder}>
                      <Ionicons name="image" size={20} color="#cccccc" />
                    </View>
                  )}
                  
                  <View style={styles.saleItemInfo}>
                    <Text style={styles.saleItemName}>
                      {itemDetails ? itemDetails.name : 'Unknown Item'}
                    </Text>
                    
                    {/* Display tags */}
                    {itemDetails?.tags && itemDetails.tags.length > 0 && (
                      <View style={styles.tagsRow}>
                        {itemDetails.tags.slice(0, 1).map(tag => (
                          <View key={tag} style={styles.tagBadge}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                        {itemDetails.tags.length > 1 && (
                          <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>+{itemDetails.tags.length - 1}</Text>
                          </View>
                        )}
                      </View>
                    )}
                    
                    <Text style={styles.saleItemDetails}>
                      {saleItem.quantity} × {formatCurrency(saleItem.priceAtSale)}
                    </Text>
                  </View>
                  <View style={styles.saleItemActions}>
                    <Text style={styles.saleItemTotal}>
                      {formatCurrency(saleItem.quantity * saleItem.priceAtSale)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(index)}
                      disabled={saving}
                    >
                      <Ionicons name="trash-outline" size={20} color="#cc0000" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>No items added yet. Please select at least one item.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={styles.divider} />

        <View style={styles.formGroup}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.paymentMethod}
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              enabled={!saving}
              style={styles.picker}
            >
              <Picker.Item label="Cash" value="cash" />
              <Picker.Item label="Credit Card" value="credit" />
              <Picker.Item label="Debit Card" value="debit" />
              <Picker.Item label="Check" value="check" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={formData.notes}
            onChangeText={(value) => handleTextChange('notes', value)}
            placeholder="Sale notes (optional)"
            multiline
            numberOfLines={3}
            editable={!saving}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Sale Summary</Text>
        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(formData.subtotal || 0)}
          </Text>
        </View>

        <View style={styles.summaryRowWithInput}>
          <View style={styles.taxRateContainer}>
            <Text style={styles.summaryLabel}>Tax Rate (%)</Text>
            <TextInput
              style={styles.taxRateInput}
              value={formData.taxRate?.toString()}
              onChangeText={(value) => handleTextChange('taxRate', value)}
              keyboardType="decimal-pad"
              editable={!saving}
            />
          </View>
          <Text style={styles.summaryValue}>
            {formatCurrency(formData.taxAmount || 0)}
          </Text>
        </View>

        <View style={styles.summaryRowWithInput}>
          <View style={styles.discountContainer}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <View style={styles.discountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.discountInput}
                value={formData.discountAmount?.toString()}
                onChangeText={(value) => handleTextChange('discountAmount', value)}
                keyboardType="decimal-pad"
                editable={!saving}
              />
            </View>
          </View>
          <Text style={styles.summaryValue}>
            -{formatCurrency(formData.discountAmount || 0)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(formData.total || 0)}
          </Text>
        </View>
      </Card>

      <TouchableOpacity
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        <Ionicons name="checkmark-circle" size={20} color="white" />
        <Text style={styles.submitButtonText}>
          {saving ? 'Processing...' : 'Complete Sale'}
        </Text>
      </TouchableOpacity>

      {/* Item Selection Modal */}
      <Modal
        visible={itemSelectVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setItemSelectVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select an Item</Text>
              <TouchableOpacity onPress={() => setItemSelectVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {availableItems.length === 0 ? (
              <Text style={styles.emptyText}>No items available in inventory.</Text>
            ) : (
              <FlatList
                data={availableItems}
                keyExtractor={item => item._id || ''}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.itemOption}
                    onPress={() => handleSelectItem(item)}
                  >
                    {/* Item Image */}
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.itemOptionImage} />
                    ) : (
                      <View style={styles.itemOptionImagePlaceholder}>
                        <Ionicons name="image" size={20} color="#cccccc" />
                      </View>
                    )}
                    
                    <View style={styles.itemOptionInfo}>
                      <Text style={styles.itemOptionName}>{item.name}</Text>
                      
                      {/* Display tags */}
                      {item.tags && item.tags.length > 0 && (
                        <View style={styles.tagsRow}>
                          {item.tags.slice(0, 2).map(tag => (
                            <View key={tag} style={styles.tagBadge}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                          {item.tags.length > 2 && (
                            <View style={styles.tagBadge}>
                              <Text style={styles.tagText}>+{item.tags.length - 2}</Text>
                            </View>
                          )}
                        </View>
                      )}
                      
                      <Text style={styles.itemOptionDetails}>
                        In stock: {item.quantity} | SKU: {item.sku}
                      </Text>
                    </View>
                    <Text style={styles.itemOptionPrice}>
                      {formatCurrency(item.price)}
                    </Text>
                  </TouchableOpacity>
                )}
              />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  selectItemButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  selectItemButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  selectedItemCard: {
    marginBottom: 16,
    padding: 12,
  },
  selectedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  selectedItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    width: 50,
    textAlign: 'center',
    marginRight: 8,
  },
  stockInfo: {
    fontSize: 12,
    color: '#757575',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addItemButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#757575',
    fontStyle: 'italic',
  },
  itemsList: {
    marginTop: 16,
  },
  saleItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  saleItemInfo: {
    flex: 2,
  },
  saleItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  saleItemDetails: {
    fontSize: 14,
    color: '#757575',
  },
  saleItemActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleItemTotal: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryRowWithInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  taxRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taxRateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    width: 50,
    textAlign: 'center',
    marginLeft: 8,
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginLeft: 8,
    paddingHorizontal: 8,
  },
  currencySymbol: {
    fontSize: 16,
  },
  discountInput: {
    padding: 8,
    width: 70,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 4,
    marginVertical: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
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
  itemOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemOptionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemOptionDetails: {
    fontSize: 14,
    color: '#757575',
  },
  itemOptionPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0a7ea4',
  },
  itemOptionImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  itemOptionImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  saleItemImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  saleItemImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 4,
  },
  tagBadge: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    color: '#333',
  },
});

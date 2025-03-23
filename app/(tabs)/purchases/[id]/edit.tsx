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
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { itemsApi, purchasesApi, Item, Purchase, PurchaseItem } from '../../../../src/services/api';
import Card from '../../../../src/components/ui/Card';
import ErrorMessage from '../../../../src/components/ui/ErrorMessage';
import LoadingIndicator from '../../../../src/components/ui/LoadingIndicator';

export default function EditPurchase() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Purchase>>({
    supplier: {
      name: '',
      contactName: '',
      email: '',
      phone: ''
    },
    items: [],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    shippingCost: 0,
    total: 0,
    paymentMethod: 'cash',
    status: 'received'
  });
  
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [weight, setWeight] = useState<string>('0');
  const [weightUnit, setWeightUnit] = useState<'oz' | 'lb' | 'g' | 'kg'>('lb');
  const [costPerUnit, setCostPerUnit] = useState<string>('0');
  const [totalCost, setTotalCost] = useState<string>('0');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [itemSelectVisible, setItemSelectVisible] = useState<boolean>(false);

  // Fetch purchase and available items
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsData, purchaseData] = await Promise.all([
          itemsApi.getAll(),
          purchasesApi.getById(id as string)
        ]);
        
        setAvailableItems(itemsData);
        setFormData(purchaseData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load purchase data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    } else {
      setLoading(false);
      setError('Purchase ID is missing');
    }
  }, [id]);

  // Recalculate totals when items, tax rate, or shipping change
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
      (sum, item) => sum + item.totalCost, 
      0
    );
    
    const taxAmount = subtotal * ((formData.taxRate || 0) / 100);
    const shippingCost = formData.shippingCost || 0;
    const total = subtotal + taxAmount + shippingCost;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total
    }));
  }, [formData.items, formData.taxRate, formData.shippingCost]);

  // Update total cost when quantity or costPerUnit changes
  useEffect(() => {
    if (selectedItem) {
      if (selectedItem.trackingType === 'weight') {
        setTotalCost((parseFloat(weight) * parseFloat(costPerUnit || '0')).toString());
      } else {
        setTotalCost((parseInt(quantity) * parseFloat(costPerUnit || '0')).toString());
      }
    }
  }, [quantity, costPerUnit, weight, weightUnit, selectedItem]);

  const handleTextChange = (field: string, value: string) => {
    if (field.startsWith('supplier.')) {
      const supplierField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        supplier: {
          ...prev.supplier,
          [supplierField]: value
        }
      }));
    } else if (field === 'taxRate' || field === 'shippingCost') {
      setFormData(prev => ({
        ...prev,
        [field]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setCostPerUnit(item.cost?.toString() || item.price.toString());
    setItemSelectVisible(false);
  };

  const handleAddItem = () => {
    if (!selectedItem) return;

    const newItem: PurchaseItem = {
      item: selectedItem._id || '',
      costPerUnit: parseFloat(costPerUnit),
      totalCost: parseFloat(totalCost)
    };

    if (selectedItem.trackingType === 'weight') {
      newItem.weight = parseFloat(weight);
      newItem.weightUnit = weightUnit;
    } else {
      newItem.quantity = parseInt(quantity);
    }

    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));

    // Reset form values
    setSelectedItem(null);
    setQuantity('1');
    setWeight('0');
    setCostPerUnit('0');
    setTotalCost('0');
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.supplier?.name) {
      setError('Supplier name is required');
      return;
    }

    if (!formData.items?.length) {
      setError('At least one item is required');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      await purchasesApi.update(id as string, formData);
      router.push('/purchases');
    } catch (err) {
      console.error('Failed to update purchase:', err);
      setError('Failed to update purchase. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getItemById = (itemId: string): Item | undefined => {
    return availableItems.find(item => item._id === itemId);
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Purchase</Text>
        <Link href="/purchases" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={18} color="#0a7ea4" />
            <Text style={styles.backButtonText}>Back to List</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {error && <ErrorMessage message={error} />}

      <Card>
        <Text style={styles.sectionTitle}>Supplier Information</Text>
        <View style={styles.divider} />

        <View style={styles.formGroup}>
          <Text style={styles.label}>Supplier Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.supplier?.name}
            onChangeText={(value) => handleTextChange('supplier.name', value)}
            placeholder="Supplier name"
            editable={!saving}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Contact Name</Text>
            <TextInput
              style={styles.input}
              value={formData.supplier?.contactName}
              onChangeText={(value) => handleTextChange('supplier.contactName', value)}
              placeholder="Contact name"
              editable={!saving}
            />
          </View>

          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.supplier?.email}
              onChangeText={(value) => handleTextChange('supplier.email', value)}
              placeholder="Email address"
              keyboardType="email-address"
              editable={!saving}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.supplier?.phone}
              onChangeText={(value) => handleTextChange('supplier.phone', value)}
              placeholder="Phone number"
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>

          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Invoice Number</Text>
            <TextInput
              style={styles.input}
              value={formData.invoiceNumber}
              onChangeText={(value) => handleTextChange('invoiceNumber', value)}
              placeholder="Invoice #"
              editable={!saving}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Purchase Date</Text>
          <TextInput
            style={styles.input}
            value={formData.purchaseDate ? new Date(formData.purchaseDate).toISOString().split('T')[0] : ''}
            onChangeText={(value) => handleTextChange('purchaseDate', value)}
            placeholder="YYYY-MM-DD"
            editable={!saving}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Purchase Items</Text>
        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.selectItemButton}
          onPress={() => setItemSelectVisible(true)}
          disabled={saving || availableItems.length === 0}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.selectItemButtonText}>
            Add Another Item
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
              {selectedItem.trackingType === 'weight' ? (
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Weight:</Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                    editable={!saving}
                  />
                  <View style={styles.weightUnitPicker}>
                    <Picker
                      selectedValue={weightUnit}
                      onValueChange={(value) => setWeightUnit(value as any)}
                      enabled={!saving}
                    >
                      <Picker.Item label="oz" value="oz" />
                      <Picker.Item label="lb" value="lb" />
                      <Picker.Item label="g" value="g" />
                      <Picker.Item label="kg" value="kg" />
                    </Picker>
                  </View>
                </View>
              ) : (
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Quantity:</Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="number-pad"
                    editable={!saving}
                  />
                </View>
              )}
              
              <View style={styles.costContainer}>
                <Text style={styles.quantityLabel}>Cost/Unit: $</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={costPerUnit}
                  onChangeText={setCostPerUnit}
                  keyboardType="decimal-pad"
                  editable={!saving}
                />
              </View>
            </View>
            
            <View style={styles.totalCostContainer}>
              <Text style={styles.totalCostLabel}>Total Cost:</Text>
              <Text style={styles.totalCostValue}>{formatCurrency(parseFloat(totalCost))}</Text>
            </View>
              
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={handleAddItem}
              disabled={saving}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.addItemButtonText}>Add to Purchase</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Display existing items */}
        {formData.items && formData.items.length > 0 ? (
          <View style={styles.itemsList}>
            {formData.items.map((purchaseItem, index) => {
              const itemDetails = typeof purchaseItem.item === 'object' 
                ? purchaseItem.item
                : getItemById(purchaseItem.item as string);
              
              return (
                <View key={index} style={styles.purchaseItemContainer}>
                  {/* Item Image */}
                  {itemDetails?.imageUrl ? (
                    <Image source={{ uri: itemDetails.imageUrl }} style={styles.purchaseItemImage} />
                  ) : (
                    <View style={styles.purchaseItemImagePlaceholder}>
                      <Ionicons name="image" size={20} color="#cccccc" />
                    </View>
                  )}
                  
                  <View style={styles.purchaseItemInfo}>
                    <Text style={styles.purchaseItemName}>
                      {itemDetails ? itemDetails.name : 'Unknown Item'}
                    </Text>
                    
                    {/* Display tags */}
                    {itemDetails?.tags && itemDetails.tags.length > 0 && (
                      <View style={styles.tagsRow}>
                        {itemDetails.tags.slice(0, 2).map(tag => (
                          <View key={tag} style={styles.tagBadge}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                        {itemDetails.tags.length > 2 && (
                          <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>+{itemDetails.tags.length - 2}</Text>
                          </View>
                        )}
                      </View>
                    )}
                    
                    <Text style={styles.purchaseItemDetails}>
                      {purchaseItem.weight 
                        ? `${purchaseItem.weight} ${purchaseItem.weightUnit} × ${formatCurrency(purchaseItem.costPerUnit)}`
                        : `${purchaseItem.quantity} × ${formatCurrency(purchaseItem.costPerUnit)}`}
                    </Text>
                  </View>
                  <View style={styles.purchaseItemActions}>
                    <Text style={styles.purchaseItemTotal}>
                      {formatCurrency(purchaseItem.totalCost)}
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
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as any }))}
              enabled={!saving}
              style={styles.picker}
            >
              <Picker.Item label="Cash" value="cash" />
              <Picker.Item label="Credit Card" value="credit" />
              <Picker.Item label="Debit Card" value="debit" />
              <Picker.Item label="Check" value="check" />
              <Picker.Item label="Bank Transfer" value="bank_transfer" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
              enabled={!saving}
              style={styles.picker}
            >
              <Picker.Item label="Received" value="received" />
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="Partially Received" value="partially_received" />
              <Picker.Item label="Cancelled" value="cancelled" />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={formData.notes}
            onChangeText={(value) => handleTextChange('notes', value)}
            placeholder="Purchase notes (optional)"
            multiline
            numberOfLines={3}
            editable={!saving}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Purchase Summary</Text>
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
          <View style={styles.shippingContainer}>
            <Text style={styles.summaryLabel}>Shipping Cost</Text>
            <View style={styles.shippingInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.shippingInput}
                value={formData.shippingCost?.toString()}
                onChangeText={(value) => handleTextChange('shippingCost', value)}
                keyboardType="decimal-pad"
                editable={!saving}
              />
            </View>
          </View>
          <Text style={styles.summaryValue}>
            {formatCurrency(formData.shippingCost || 0)}
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
        onPress={handleSave}
        disabled={saving}
      >
        <Ionicons name="save" size={20} color="white" />
        <Text style={styles.submitButtonText}>
          {saving ? 'Saving...' : 'Update Purchase'}
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
                        {item.trackingType === 'quantity'
                          ? `In stock: ${item.quantity} | SKU: ${item.sku}`
                          : `In stock: ${item.weight} ${item.weightUnit} | SKU: ${item.sku}`
                        }
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
    width: 70,
    textAlign: 'center',
  },
  weightUnitPicker: {
    width: 100,
    height: 40,
    marginLeft: 8,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalCostValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  stockInfo: {
    fontSize: 12,
    color: '#757575',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  purchaseItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  purchaseItemInfo: {
    flex: 2,
  },
  purchaseItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  purchaseItemDetails: {
    fontSize: 14,
    color: '#757575',
  },
  purchaseItemActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchaseItemTotal: {
    fontSize: 16,
    fontWeight: '500',
  },
  purchaseItemImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  purchaseItemImagePlaceholder: {
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
  shippingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shippingInputContainer: {
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
  shippingInput: {
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
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 4,
    marginVertical: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#76b8c8',
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
});
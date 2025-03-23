import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Image } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { itemsApi, Item } from '../../../src/services/api';
import LoadingIndicator from '../../../src/components/ui/LoadingIndicator';
import Card from '../../../src/components/ui/Card';
import ErrorMessage from '../../../src/components/ui/ErrorMessage';

export default function InventoryList() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await itemsApi.getAll();
        setItems(data);
        setFilteredItems(data);
      } catch (err) {
        console.error('Failed to fetch inventory items:', err);
        setError('Failed to load inventory. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(lowerCaseQuery) || 
        item.sku.toLowerCase().includes(lowerCaseQuery) ||
        item.category.toLowerCase().includes(lowerCaseQuery) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchQuery, items]);

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <Link href="/inventory/new" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={18} color="white" />
            <Text style={styles.buttonText}>Add Item</Text>
          </TouchableOpacity>
        </Link>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#757575" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, SKU, category or tag..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {error && <ErrorMessage message={error} />}

      {filteredItems.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>
            No inventory items found. Click "Add Item" to create your first inventory item.
          </Text>
        </Card>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item._id || ''}
          renderItem={({ item }) => (
            <Link href={`/inventory/${item._id}`} asChild>
              <TouchableOpacity>
                <Card>
                  <View style={styles.itemContainer}>
                    {item.imageUrl ? (
                      <Image 
                        source={{ uri: item.imageUrl }} 
                        style={styles.itemImage} 
                      />
                    ) : (
                      <View style={styles.itemImagePlaceholder}>
                        <Ionicons name="image" size={24} color="#cccccc" />
                      </View>
                    )}
                    
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDetails}>
                        SKU: {item.sku} | Category: {item.category}
                      </Text>
                      
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
                    </View>
                    <View style={styles.itemMetrics}>
                      <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                      <View style={styles.quantityContainer}>
                        <Text 
                          style={[
                            styles.itemQuantity,
                            item.quantity === 0 ? styles.outOfStock : null,
                            item.quantity < 5 && item.quantity > 0 ? styles.lowStock : null
                          ]}
                        >
                          {item.quantity} in stock
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </Link>
          )}
        />
      )}
    </View>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#757575',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 2,
  },
  itemMetrics: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#757575',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  quantityContainer: {
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 14,
  },
  outOfStock: {
    color: '#cc0000',
    fontWeight: 'bold',
  },
  lowStock: {
    color: '#ff9800',
    fontWeight: '500',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 6,
  },
  tagBadge: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
  },
});

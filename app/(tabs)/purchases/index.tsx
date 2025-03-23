import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { purchasesApi, Purchase } from '../../../src/services/api';
import LoadingIndicator from '../../../src/components/ui/LoadingIndicator';
import Card from '../../../src/components/ui/Card';
import ErrorMessage from '../../../src/components/ui/ErrorMessage';

export default function PurchasesList() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const data = await purchasesApi.getAll();
        setPurchases(data);
        setFilteredPurchases(data);
      } catch (err) {
        console.error('Failed to fetch purchases:', err);
        setError('Failed to load purchases. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = purchases.filter(purchase => 
        (purchase.supplier.name && purchase.supplier.name.toLowerCase().includes(lowerCaseQuery)) || 
        (purchase.invoiceNumber && purchase.invoiceNumber.toLowerCase().includes(lowerCaseQuery)) ||
        (purchase._id && purchase._id.includes(lowerCaseQuery))
      );
      setFilteredPurchases(filtered);
    } else {
      setFilteredPurchases(purchases);
    }
  }, [searchQuery, purchases]);

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Purchase",
      "Are you sure you want to delete this purchase? This will revert inventory changes.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await purchasesApi.delete(id);
              setPurchases(prevPurchases => prevPurchases.filter(purchase => purchase._id !== id));
            } catch (err) {
              console.error('Failed to delete purchase:', err);
              setError('Failed to delete purchase. Please try again.');
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return '#4caf50'; // green
      case 'pending': return '#ff9800'; // orange
      case 'partially_received': return '#2196f3'; // blue
      case 'cancelled': return '#f44336'; // red
      default: return '#9e9e9e'; // grey
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Purchases</Text>
        <Link href="/purchases/new" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={18} color="white" />
            <Text style={styles.buttonText}>New Purchase</Text>
          </TouchableOpacity>
        </Link>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#757575" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by supplier name or invoice number..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {error && <ErrorMessage message={error} />}

      {filteredPurchases.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>
            No purchases found. Click "New Purchase" to create your first purchase.
          </Text>
        </Card>
      ) : (
        <FlatList
          data={filteredPurchases}
          keyExtractor={purchase => purchase._id || ''}
          renderItem={({ item: purchase }) => (
            <Link href={`/purchases/${purchase._id}`} asChild>
              <TouchableOpacity>
                <Card>
                  <View style={styles.purchaseContainer}>
                    <View style={styles.purchaseInfo}>
                      <Text style={styles.supplierName}>
                        {purchase.supplier.name || 'Unknown Supplier'}
                      </Text>
                      <Text style={styles.purchaseDetails}>
                        {purchase.purchaseDate && formatDate(purchase.purchaseDate)} • {purchase.items.length} item(s)
                        {purchase.invoiceNumber && ` • Invoice: ${purchase.invoiceNumber}`}
                      </Text>
                    </View>
                    
                    <View style={styles.purchaseMetrics}>
                      <Text style={styles.purchasePrice}>{formatCurrency(purchase.total)}</Text>
                      <View style={styles.statusContainer}>
                        <View 
                          style={[
                            styles.statusBadge, 
                            { backgroundColor: getStatusColor(purchase.status) }
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {purchase.status.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => purchase._id && handleDelete(purchase._id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#cc0000" />
                    </TouchableOpacity>
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
  purchaseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchaseInfo: {
    flex: 2,
  },
  purchaseMetrics: {
    flex: 1,
    alignItems: 'flex-end',
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  purchaseDetails: {
    fontSize: 14,
    color: '#757575',
  },
  purchasePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a7ea4',
    marginBottom: 4,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 8,
  }
});
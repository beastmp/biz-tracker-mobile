import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { salesApi, Sale } from '../../src/services/api';
import LoadingIndicator from '../../src/components/ui/LoadingIndicator';
import Card from '../../src/components/ui/Card';
import ErrorMessage from '../../src/components/ui/ErrorMessage';

export default function SalesList() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const data = await salesApi.getAll();
        setSales(data);
        setFilteredSales(data);
      } catch (err) {
        console.error('Failed to fetch sales:', err);
        setError('Failed to load sales. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = sales.filter(sale => 
        (sale.customerName && sale.customerName.toLowerCase().includes(lowerCaseQuery)) || 
        (sale._id && sale._id.includes(lowerCaseQuery))
      );
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  }, [searchQuery, sales]);

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Sale",
      "Are you sure you want to delete this sale? This will restore inventory quantities.",
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
              await salesApi.delete(id);
              setSales(prevSales => prevSales.filter(sale => sale._id !== id));
            } catch (err) {
              console.error('Failed to delete sale:', err);
              setError('Failed to delete sale. Please try again.');
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
      case 'completed': return '#4caf50'; // green
      case 'refunded': return '#f44336'; // red
      case 'partially_refunded': return '#ff9800'; // orange
      default: return '#9e9e9e'; // grey
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales</Text>
        <Link href="/sales/new" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={18} color="white" />
            <Text style={styles.buttonText}>New Sale</Text>
          </TouchableOpacity>
        </Link>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#757575" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer name or sale ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {error && <ErrorMessage message={error} />}

      {filteredSales.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>
            No sales found. Click "New Sale" to create your first sale.
          </Text>
        </Card>
      ) : (
        <FlatList
          data={filteredSales}
          keyExtractor={sale => sale._id || ''}
          renderItem={({ item: sale }) => (
            <Link href={`/sales/${sale._id}`} asChild>
              <TouchableOpacity>
                <Card>
                  <View style={styles.saleContainer}>
                    <View style={styles.saleInfo}>
                      <Text style={styles.customerName}>
                        {sale.customerName || 'Guest Customer'}
                      </Text>
                      <Text style={styles.saleDetails}>
                        {sale.createdAt && formatDate(sale.createdAt)} • {sale.items.length} item(s)
                      </Text>
                    </View>
                    
                    <View style={styles.saleMetrics}>
                      <Text style={styles.salePrice}>{formatCurrency(sale.total)}</Text>
                      <View style={styles.statusContainer}>
                        <View 
                          style={[
                            styles.statusBadge, 
                            { backgroundColor: getStatusColor(sale.status) }
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {sale.status.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => sale._id && handleDelete(sale._id)}
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
  saleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleInfo: {
    flex: 2,
  },
  saleMetrics: {
    flex: 1,
    alignItems: 'flex-end',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  saleDetails: {
    fontSize: 14,
    color: '#757575',
  },
  salePrice: {
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

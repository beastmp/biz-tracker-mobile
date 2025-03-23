import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { itemsApi, Item } from '../../src/services/api';
import LoadingIndicator from '../../src/components/ui/LoadingIndicator';
import Card from '../../src/components/ui/Card';
import ErrorMessage from '../../src/components/ui/ErrorMessage';

export default function InventoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      try {
        const data = await itemsApi.getById(id);
        setItem(data);
      } catch (err) {
        console.error('Failed to fetch item:', err);
        setError('Failed to load item details. The item may have been deleted.');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
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
              await itemsApi.delete(id);
              router.replace('/inventory');
            } catch (err) {
              console.error('Failed to delete item:', err);
              setError('Failed to delete item. Please try again.');
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error || !item) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Item Not Found</Text>
          <Link href="/inventory" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons name="arrow-back" size={18} color="#0a7ea4" />
              <Text style={styles.backButtonText}>Back to Inventory</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <ErrorMessage message={error || "The requested item could not be found."} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.name}</Text>
      </View>

      <View style={styles.actions}>
        <Link href="/inventory" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={18} color="#0a7ea4" />
            <Text style={styles.backButtonText}>Back to List</Text>
          </TouchableOpacity>
        </Link>
        
        <View style={styles.actionButtons}>
          <Link href={`/inventory/${id}/edit`} asChild>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="create" size={18} color="white" />
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
          </Link>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={18} color="white" />
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SKU</Text>
            <Text style={styles.detailValue}>{item.sku}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{item.description || "No description provided"}</Text>
          </View>
        </Card>

        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Inventory Status</Text>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity in Stock</Text>
            <Text style={[
              styles.stockValue,
              item.quantity > 0 ? styles.inStock : styles.outOfStock
            ]}>
              {item.quantity}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.priceValue}>{formatCurrency(item.price)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Inventory Value</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.price * item.quantity)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Updated</Text>
            <Text style={styles.detailValue}>{item.lastUpdated ? formatDate(item.lastUpdated) : "Unknown"}</Text>
          </View>
        </Card>
      </View>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#cc0000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  detailsCard: {
    marginBottom: 16,
  },
  statsCard: {},
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
  },
  stockValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  inStock: {
    color: '#4caf50',
  },
  outOfStock: {
    color: '#cc0000',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  categoryBadge: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 14,
  },
});

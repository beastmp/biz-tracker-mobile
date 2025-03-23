import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { salesApi, Sale } from '../../src/services/api';
import LoadingIndicator from '../../src/components/ui/LoadingIndicator';
import Card from '../../src/components/ui/Card';
import ErrorMessage from '../../src/components/ui/ErrorMessage';

export default function SaleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSale = async () => {
      if (!id) return;
      
      try {
        const data = await salesApi.getById(id);
        setSale(data);
      } catch (err) {
        console.error('Failed to fetch sale:', err);
        setError('Failed to load sale details. The sale may have been deleted.');
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    
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
              router.replace('/sales');
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'refunded': return '#f44336';
      case 'partially_refunded': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'credit': return 'Credit Card';
      case 'debit': return 'Debit Card';
      case 'check': return 'Check';
      default: return 'Other';
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error || !sale) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sale Not Found</Text>
          <Link href="/sales" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons name="arrow-back" size={18} color="#0a7ea4" />
              <Text style={styles.backButtonText}>Back to Sales</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <ErrorMessage message={error || "The requested sale could not be found."} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sale Details</Text>
        <Text style={styles.idText}>{sale._id}</Text>
      </View>

      <View style={styles.actions}>
        <Link href="/sales" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={18} color="#0a7ea4" />
            <Text style={styles.backButtonText}>Back to List</Text>
          </TouchableOpacity>
        </Link>
        
        <View style={styles.actionButtons}>
          <Link href={`/sales/${id}/edit`} asChild>
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
        <Card>
          <Text style={styles.sectionTitle}>Sale Information</Text>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {sale.createdAt ? formatDate(sale.createdAt) : 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
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
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{getPaymentMethodLabel(sale.paymentMethod)}</Text>
          </View>
          
          {sale.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{sale.notes}</Text>
            </View>
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.divider} />
          
          {!sale.customerName && !sale.customerEmail && !sale.customerPhone ? (
            <Text style={styles.emptyText}>No customer information provided</Text>
          ) : (
            <>
              {sale.customerName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{sale.customerName}</Text>
                </View>
              )}
              
              {sale.customerEmail && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{sale.customerEmail}</Text>
                </View>
              )}
              
              {sale.customerPhone && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{sale.customerPhone}</Text>
                </View>
              )}
            </>
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Sale Summary</Text>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Subtotal</Text>
            <Text style={styles.detailValue}>{formatCurrency(sale.subtotal)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tax ({sale.taxRate}%)</Text>
            <Text style={styles.detailValue}>{formatCurrency(sale.taxAmount)}</Text>
          </View>
          
          {sale.discountAmount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Discount</Text>
              <Text style={styles.detailValue}>-{formatCurrency(sale.discountAmount)}</Text>
            </View>
          )}
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(sale.total)}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Sale Items</Text>
          <View style={styles.divider} />
          
          {sale.items.map((item, index) => {
            const itemName = typeof item.item === 'object' && item.item.name 
              ? item.item.name 
              : 'Unknown Item';
            
            const itemImage = typeof item.item === 'object' && item.item.imageUrl
              ? item.item.imageUrl
              : null;
              
            const itemTags = typeof item.item === 'object' && item.item.tags
              ? item.item.tags
              : [];
              
            return (
              <View key={index} style={styles.saleItemContainer}>
                {/* Item Image */}
                {itemImage ? (
                  <Image source={{ uri: itemImage }} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Ionicons name="image" size={24} color="#cccccc" />
                  </View>
                )}
                
                <View style={styles.saleItemDetails}>
                  <Text style={styles.saleItemName}>{itemName}</Text>
                  
                  {/* Display tags */}
                  {itemTags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {itemTags.slice(0, 2).map(tag => (
                        <View key={tag} style={styles.tagBadge}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                      {itemTags.length > 2 && (
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagText}>+{itemTags.length - 2}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  <Text style={styles.saleItemQuantity}>{item.quantity} × {formatCurrency(item.priceAtSale)}</Text>
                </View>
                <Text style={styles.saleItemTotal}>{formatCurrency(item.quantity * item.priceAtSale)}</Text>
              </View>
            );
          })}
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
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  idText: {
    fontSize: 14,
    color: '#757575',
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
    gap: 16,
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
  emptyText: {
    color: '#757575',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    textTransform: 'capitalize',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  saleItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  saleItemDetails: {
    flex: 3,
  },
  saleItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  saleItemQuantity: {
    fontSize: 14,
    color: '#757575',
  },
  saleItemTotal: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 10,
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 6,
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
    marginBottom: 2,
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

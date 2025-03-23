import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { itemsApi, Item, salesApi, Sale } from '../src/services/api';
import Card from '../src/components/ui/Card';
import LoadingIndicator from '../src/components/ui/LoadingIndicator';

export default function Dashboard() {
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: [] as Item[],
  });
  
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    recentSales: [] as Sale[],
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch inventory data
        const items = await itemsApi.getAll();
        
        const totalItems = items.length;
        const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const lowStockItems = items.filter(item => item.quantity < 5).sort((a, b) => a.quantity - b.quantity);
        
        setInventoryStats({
          totalItems,
          totalValue,
          lowStockItems,
        });

        // Fetch sales data - last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        const salesReport = await salesApi.getReport(startDate, endDate);
        setSalesStats({
          totalSales: salesReport.totalSales,
          totalRevenue: salesReport.totalRevenue,
          recentSales: salesReport.sales.slice(0, 5),
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardText}>Inventory Items</Text>
            <Ionicons name="cube" size={24} color="#0a7ea4" />
          </View>
          <Text style={styles.cardValue}>{inventoryStats.totalItems}</Text>
          <Link href="/inventory" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>View inventory</Text>
            </TouchableOpacity>
          </Link>
        </Card>

        <Card style={styles.statsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardText}>Inventory Value</Text>
            <Ionicons name="trending-up" size={24} color="#4caf50" />
          </View>
          <Text style={styles.cardValue}>{formatCurrency(inventoryStats.totalValue)}</Text>
        </Card>

        <Card style={styles.statsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardText}>Sales (30 days)</Text>
            <Ionicons name="cart" size={24} color="#2196f3" />
          </View>
          <Text style={styles.cardValue}>{salesStats.totalSales}</Text>
          <Link href="/sales" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>View sales</Text>
            </TouchableOpacity>
          </Link>
        </Card>

        <Card style={styles.statsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardText}>Revenue (30 days)</Text>
            <Ionicons name="trending-up" size={24} color="#9c27b0" />
          </View>
          <Text style={styles.cardValue}>{formatCurrency(salesStats.totalRevenue)}</Text>
          <Link href="/sales/reports" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>View reports</Text>
            </TouchableOpacity>
          </Link>
        </Card>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Low Stock Items</Text>
        <View style={styles.divider} />
        
        {inventoryStats.lowStockItems.length === 0 ? (
          <Text style={styles.emptyText}>No items are low in stock.</Text>
        ) : (
          inventoryStats.lowStockItems.slice(0, 5).map((item) => (
            <Link key={item._id} href={`/inventory/${item._id}`} asChild>
              <TouchableOpacity style={styles.listItem}>
                <View>
                  <Text style={item.quantity === 0 ? styles.outOfStockText : styles.itemText}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemSubtext}>
                    SKU: {item.sku} | {item.quantity} in stock
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>
          ))
        )}
      </Card>

      <Card>
        <View style={styles.cardHeaderWithButton}>
          <Text style={styles.sectionTitle}>Recent Sales</Text>
          <Link href="/sales/new" asChild>
            <TouchableOpacity style={styles.button}>
              <Ionicons name="add" size={16} color="white" />
              <Text style={styles.buttonText}>New Sale</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View style={styles.divider} />
        
        {salesStats.recentSales.length === 0 ? (
          <Text style={styles.emptyText}>
            No recent sales found. Create your first sale to start tracking.
          </Text>
        ) : (
          salesStats.recentSales.map((sale) => (
            <Link key={sale._id} href={`/sales/${sale._id}`} asChild>
              <TouchableOpacity style={styles.listItem}>
                <View style={styles.salesListItem}>
                  <View>
                    <Text style={styles.itemText}>
                      {sale.customerName || 'Guest Customer'}
                    </Text>
                    <Text style={styles.itemSubtext}>
                      {sale.createdAt && formatDate(sale.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.saleAmount}>
                    {formatCurrency(sale.total)}
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>
          ))
        )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    width: '48%',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    color: '#757575',
    fontSize: 14,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  linkText: {
    color: '#0a7ea4',
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
  emptyText: {
    color: '#757575',
    fontStyle: 'italic',
    marginVertical: 8,
  },
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  salesListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
  },
  outOfStockText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#cc0000',
  },
  itemSubtext: {
    fontSize: 14,
    color: '#757575',
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
  },
});

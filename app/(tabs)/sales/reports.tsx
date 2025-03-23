import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { salesApi, Sale } from '../../../src/services/api';
import LoadingIndicator from '../../../src/components/ui/LoadingIndicator';
import Card from '../../../src/components/ui/Card';
import ErrorMessage from '../../../src/components/ui/ErrorMessage';

interface ReportData {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  sales: Sale[];
}

export default function SalesReport() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Get sales by payment method
  const getPaymentMethodStats = () => {
    if (!reportData?.sales) return [];

    const methodCounts: Record<string, number> = {};
    reportData.sales.forEach(sale => {
      const method = sale.paymentMethod;
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    return Object.entries(methodCounts).map(([method, count]) => ({
      method,
      count,
      percentage: (count / reportData.sales.length) * 100
    }));
  };

  // Get sales by status
  const getStatusStats = () => {
    if (!reportData?.sales) return [];

    const statusCounts: Record<string, number> = {};
    reportData.sales.forEach(sale => {
      const status = sale.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / reportData.sales.length) * 100
    }));
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await salesApi.getReport(startDate, endDate);
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch sales report:', error);
      setError('Failed to load sales report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const getMethodLabel = (method: string) => {
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales Reports</Text>
      </View>

      <Card>
        <View style={styles.dateRangeContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.generateButton}
          onPress={fetchReport}
          disabled={loading || !startDate || !endDate}
        >
          <Ionicons name="search" size={18} color="white" />
          <Text style={styles.buttonText}>Generate Report</Text>
        </TouchableOpacity>
        
        {error && <ErrorMessage message={error} />}
      </Card>

      {reportData && (
        <>
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Total Sales</Text>
                <Ionicons name="bar-chart" size={24} color="#0a7ea4" />
              </View>
              <Text style={styles.statValue}>{reportData.totalSales}</Text>
              <Text style={styles.dateRangeText}>
                {`${formatDate(startDate)} to ${formatDate(endDate)}`}
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Total Revenue</Text>
                <Ionicons name="trending-up" size={24} color="#4caf50" />
              </View>
              <Text style={styles.statValue}>{formatCurrency(reportData.totalRevenue)}</Text>
              <Text style={styles.dateRangeText}>
                {`${formatDate(startDate)} to ${formatDate(endDate)}`}
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Average Order</Text>
                <Ionicons name="calculator" size={24} color="#2196f3" />
              </View>
              <Text style={styles.statValue}>{formatCurrency(reportData.averageOrderValue)}</Text>
              <Text style={styles.dateRangeText}>
                {`${formatDate(startDate)} to ${formatDate(endDate)}`}
              </Text>
            </Card>
          </View>

          <Card>
            <Text style={styles.sectionTitle}>Sales by Payment Method</Text>
            <View style={styles.divider} />
            
            {getPaymentMethodStats().map((stat) => (
              <View key={stat.method} style={styles.statRow}>
                <View style={styles.statInfo}>
                  <Text style={styles.statName}>
                    {getMethodLabel(stat.method)}
                  </Text>
                  <View style={styles.percentBar}>
                    <View 
                      style={[
                        styles.percentFill, 
                        { width: `${stat.percentage}%`, backgroundColor: '#0a7ea4' }
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.statValues}>
                  <Text style={styles.statCount}>{stat.count}</Text>
                  <Text style={styles.statPercent}>{stat.percentage.toFixed(1)}%</Text>
                </View>
              </View>
            ))}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Sales by Status</Text>
            <View style={styles.divider} />
            
            {getStatusStats().map((stat) => (
              <View key={stat.status} style={styles.statRow}>
                <View style={styles.statInfo}>
                  <View style={styles.statusContainer}>
                    <View 
                      style={[
                        styles.statusIndicator, 
                        { backgroundColor: getStatusColor(stat.status) }
                      ]}
                    />
                    <Text style={styles.statName}>
                      {stat.status.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={styles.percentBar}>
                    <View 
                      style={[
                        styles.percentFill, 
                        { width: `${stat.percentage}%`, backgroundColor: getStatusColor(stat.status) }
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.statValues}>
                  <Text style={styles.statCount}>{stat.count}</Text>
                  <Text style={styles.statPercent}>{stat.percentage.toFixed(1)}%</Text>
                </View>
              </View>
            ))}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Recent Sales</Text>
            <View style={styles.divider} />
            
            {reportData.sales.length === 0 ? (
              <Text style={styles.emptyText}>
                No sales found in the selected date range.
              </Text>
            ) : (
              reportData.sales.slice(0, 10).map((sale) => (
                <Link key={sale._id} href={`/sales/${sale._id}`} asChild>
                  <TouchableOpacity style={styles.saleItem}>
                    <View style={styles.saleHeader}>
                      <Text style={styles.saleCustomer}>
                        {sale.customerName || 'Guest Customer'}
                      </Text>
                      <Text style={styles.saleTotal}>
                        {formatCurrency(sale.total)}
                      </Text>
                    </View>
                    <View style={styles.saleDetails}>
                      <Text style={styles.saleDate}>
                        {sale.createdAt && formatDate(sale.createdAt)}
                        {' • '}
                        {sale.items.length} item(s)
                      </Text>
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
                  </TouchableOpacity>
                </Link>
              ))
            )}

            {reportData.sales.length > 10 && (
              <Link href="/sales" asChild>
                <TouchableOpacity style={styles.viewMoreButton}>
                  <Text style={styles.viewMoreText}>View all sales</Text>
                </TouchableOpacity>
              </Link>
            )}
          </Card>
        </>
      )}
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
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formGroup: {
    width: '48%',
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
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  generateButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '100%',
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: '#757575',
    fontSize: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#757575',
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statInfo: {
    flex: 1,
    marginRight: 16,
  },
  statName: {
    fontSize: 16,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  percentBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  percentFill: {
    height: '100%',
  },
  statValues: {
    width: 80,
    alignItems: 'flex-end',
  },
  statCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statPercent: {
    fontSize: 14,
    color: '#757575',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  emptyText: {
    color: '#757575',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  saleItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  saleCustomer: {
    fontSize: 16,
    fontWeight: '500',
  },
  saleTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleDate: {
    fontSize: 14,
    color: '#757575',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    textTransform: 'capitalize',
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewMoreText: {
    color: '#0a7ea4',
    fontWeight: '500',
  },
});

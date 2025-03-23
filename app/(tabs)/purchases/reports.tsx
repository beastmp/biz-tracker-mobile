import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { purchasesApi, Purchase } from '../../../src/services/api';
import LoadingIndicator from '../../../src/components/ui/LoadingIndicator';
import Card from '../../../src/components/ui/Card';
import ErrorMessage from '../../../src/components/ui/ErrorMessage';

interface ReportData {
  startDate: string;
  endDate: string;
  totalPurchases: number;
  totalCost: number;
  averagePurchaseValue: number;
  purchases: Purchase[];
}

export default function PurchasesReport() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!isValidDateFormat(startDate) && startDate !== '') {
      setError('Start date must be in YYYY-MM-DD format');
      return;
    }
    
    if (!isValidDateFormat(endDate) && endDate !== '') {
      setError('End date must be in YYYY-MM-DD format');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await purchasesApi.getReport(startDate, endDate);
      setReportData({
        startDate: startDate || 'All time',
        endDate: endDate || 'Present',
        totalPurchases: data.totalPurchases,
        totalCost: data.totalCost,
        averagePurchaseValue: data.averagePurchaseValue,
        purchases: data.purchases
      });
    } catch (err) {
      console.error('Failed to fetch report:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const isValidDateFormat = (dateString: string) => {
    if (!dateString) return true;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
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
      case 'received': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'partially_received': return '#2196f3';
      case 'cancelled': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'credit': return 'Credit Card';
      case 'debit': return 'Debit Card';
      case 'check': return 'Check';
      case 'bank_transfer': return 'Bank Transfer';
      default: return 'Other';
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Purchase Reports</Text>
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
        >
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={styles.generateButtonText}>Generate Report</Text>
        </TouchableOpacity>
      </Card>

      {error && <ErrorMessage message={error} />}

      {reportData && (
        <>
          <Card>
            <Text style={styles.reportTitle}>
              Purchase Summary: {reportData.startDate} to {reportData.endDate}
            </Text>
            <View style={styles.divider} />
            
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Total Purchases</Text>
                <Text style={styles.statValue}>{reportData.totalPurchases}</Text>
              </View>
              
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Total Cost</Text>
                <Text style={styles.statValue}>{formatCurrency(reportData.totalCost)}</Text>
              </View>
            </View>
            
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Avg Purchase Value</Text>
                <Text style={styles.statValue}>{formatCurrency(reportData.averagePurchaseValue)}</Text>
              </View>
            </View>
          </Card>

          <Card>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Recent Purchases</Text>
              <Link href="/purchases" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>View all</Text>
                </TouchableOpacity>
              </Link>
            </View>
            <View style={styles.divider} />

            {reportData.purchases.length === 0 ? (
              <Text style={styles.emptyText}>No purchases found in the selected date range.</Text>
            ) : (
              reportData.purchases.slice(0, 10).map((purchase) => (
                <Link key={purchase._id} href={`/purchases/${purchase._id}`} asChild>
                  <TouchableOpacity style={styles.purchaseItem}>
                    <View>
                      <Text style={styles.supplierName}>
                        {purchase.supplier?.name || 'Unknown Supplier'}
                      </Text>
                      <Text style={styles.purchaseDetails}>
                        {purchase.purchaseDate && formatDate(purchase.purchaseDate)} • {purchase.items.length} item(s)
                      </Text>
                    </View>
                    
                    <View style={styles.purchaseMetrics}>
                      <Text style={styles.purchaseTotal}>
                        {formatCurrency(purchase.total)}
                      </Text>
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
                  </TouchableOpacity>
                </Link>
              ))
            )}

            {reportData.purchases.length > 10 && (
              <Link href="/purchases" asChild>
                <TouchableOpacity style={styles.viewMoreButton}>
                  <Text style={styles.viewMoreText}>View all purchases</Text>
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
  generateButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 4,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#0a7ea4',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#757575',
    fontStyle: 'italic',
  },
  purchaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  purchaseMetrics: {
    alignItems: 'flex-end',
  },
  purchaseTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a7ea4',
    marginBottom: 4,
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
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewMoreText: {
    color: '#0a7ea4',
    fontSize: 14,
  }
});
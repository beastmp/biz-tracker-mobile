import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Card from '../src/components/ui/Card';

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.errorCode}>404</Text>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.message}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.button}>
            <Ionicons name="home" size={20} color="white" />
            <Text style={styles.buttonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </Link>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
  },
  errorCode: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
});

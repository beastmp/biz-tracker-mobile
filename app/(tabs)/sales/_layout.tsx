import React from 'react';
import { Stack } from 'expo-router';

export default function SalesLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          headerTitle: "Sale Details",
          headerBackTitle: "Sales"
        }} 
      />
      <Stack.Screen 
        name="new" 
        options={{ 
          headerTitle: "New Sale",
          headerBackTitle: "Sales"
        }} 
      />
      <Stack.Screen 
        name="reports" 
        options={{ 
          headerTitle: "Sales Reports",
          headerBackTitle: "Sales"
        }} 
      />
      <Stack.Screen 
        name="[id]/edit" 
        options={{ 
          headerTitle: "Edit Sale",
          headerBackTitle: "Details"
        }} 
      />
    </Stack>
  );
}
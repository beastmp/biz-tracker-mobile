import React from 'react';
import { Stack } from 'expo-router';

export default function InventoryLayout() {
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
          headerTitle: "Item Details",
          headerBackTitle: "Inventory"
        }} 
      />
      <Stack.Screen 
        name="new" 
        options={{ 
          headerTitle: "New Item",
          headerBackTitle: "Inventory"
        }} 
      />
      <Stack.Screen 
        name="[id]/edit" 
        options={{ 
          headerTitle: "Edit Item",
          headerBackTitle: "Details"
        }} 
      />
      <Stack.Screen 
        name="filter" 
        options={{ 
          headerTitle: "Filter Inventory",
          headerBackTitle: "Inventory"
        }} 
      />
    </Stack>
  );
}
import React from 'react';
import { Stack } from 'expo-router';

export default function PurchasesLayout() {
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
          headerTitle: "Purchase Details",
          headerBackTitle: "Purchases"
        }} 
      />
      <Stack.Screen 
        name="new" 
        options={{ 
          headerTitle: "New Purchase",
          headerBackTitle: "Purchases"
        }} 
      />
      <Stack.Screen 
        name="reports" 
        options={{ 
          headerTitle: "Purchase Reports",
          headerBackTitle: "Purchases"
        }} 
      />
      <Stack.Screen 
        name="[id]/edit" 
        options={{ 
          headerTitle: "Edit Purchase",
          headerBackTitle: "Details"
        }} 
      />
    </Stack>
  );
}
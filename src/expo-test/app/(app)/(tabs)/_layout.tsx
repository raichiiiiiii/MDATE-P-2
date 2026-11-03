import { Stack } from 'expo-router';
import React from 'react';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Set to true if you want default headers
      }}
    >
      <Stack.Screen name="index" />
      {/* Add other screens here if needed */}
    </Stack>
  );
}

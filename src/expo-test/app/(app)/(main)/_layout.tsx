import { Stack } from 'expo-router';
import React from 'react';

export default function Layout() {
  return (
    <Stack
      initialRouteName="dashboard"  
      screenOptions={{
        headerShown: false, // Set to true if you want default headers
      }}
    >
      <Stack.Screen name="dashboard"  />
      <Stack.Screen name="modules"    />
      <Stack.Screen name="progress"   />
      <Stack.Screen name ="setting"   />
    </Stack>
  );
}

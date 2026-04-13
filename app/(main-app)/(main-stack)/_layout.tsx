import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'index',
          }}
      />
      <Stack.Screen
        name="modification"
        options={{
          title: 'modification',
          }}
      />
      <Stack.Screen
          name="sign-details"
          options={{
              title: 'sign-details',
          }}
      />
    </Stack>
  );
}

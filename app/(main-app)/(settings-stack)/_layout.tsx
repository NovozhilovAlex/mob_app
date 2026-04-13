import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}>
      <Stack.Screen
        name="settings"
        options={{
          title: 'settings',
          }}
      />
      <Stack.Screen
        name="language"
        options={{
          title: 'language',
          }}
      />
      <Stack.Screen
          name="orientation"
          options={{
              title: 'orientation',
          }}
      />
    </Stack>
  );
}

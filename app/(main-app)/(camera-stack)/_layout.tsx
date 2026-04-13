import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}>
      <Stack.Screen
        name="camera"
        options={{
          title: 'camera',
          }}
      />
      <Stack.Screen
        name="recognizeResult"
        options={{
          title: 'recognizeResult',
          }}
      />
      <Stack.Screen
          name="signCheck"
          options={{
              title: 'signCheck',
          }}
      />
        <Stack.Screen
            name="signCheckResult"
            options={{
                title: 'signCheckResult',
            }}
        />
    </Stack>
  );
}

import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}>
      <Stack.Screen
        name="info"
        options={{
          title: 'info',
        }}
      />
      <Stack.Screen
        name="instruction"
        options={{
          title: 'instruction',
        }}
      />
      <Stack.Screen
        name="authenticity"
        options={{
          title: 'authenticity',
        }}
      />
      <Stack.Screen
        name="news"
        options={{
          title: 'news',
        }}
      />
      <Stack.Screen
        name="license"
        options={{
          title: 'license',
        }}
      />
      <Stack.Screen
        name="about-app"
        options={{
          title: 'about-app',
        }}
      />
      <Stack.Screen
        name="testPage"
        options={{
          title: 'testPage',
        }}
      />
    </Stack>
  );
}

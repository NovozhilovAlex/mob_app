import React from 'react';
import { Stack } from 'expo-router';
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {accessibilityStrings} from "@/src/locales/accesibilityStrings";

export default function AccessibilityLayout() {
  const {nightMode} = useAppSettingsStore();
  const headerTintColor = nightMode ?'#ffffff' : '#1c1c1e' ;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: nightMode ? '#1c1c1e' : '#ffffff'
        },
        headerTintColor: headerTintColor,
        headerTitleStyle: { fontWeight: 'regular' },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: accessibilityStrings.res.recognition_page_header,
          }}
      />

      <Stack.Screen
        name="settings"
        options={{
          title: accessibilityStrings.res.settings,
        }}
      />

      <Stack.Screen
        name="instruction"
        options={{
          title: accessibilityStrings.res.instruction_page_name,
        }}
      />

      <Stack.Screen
        name="nominals"
        options={{
          title: accessibilityStrings.res.banknote_info_page_name,
        }}
      />

      <Stack.Screen
        name="modifications"
        options={{
          title: accessibilityStrings.res.banknote_info_page_name,
        }}
      />

      <Stack.Screen
        name="banknote-info"
        options={{
          title: accessibilityStrings.res.banknote_info_page_title,
        }}
      />

    </Stack>
  );
}

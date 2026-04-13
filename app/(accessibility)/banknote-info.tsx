import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    StatusBar
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {useLocalSearchParams, useRouter} from "expo-router";
import {accessibilityStrings} from "@/src/locales/accesibilityStrings";
import AccessibilityButton from "@/src/components/AccessibilityButton";
import {OrientationLock} from "expo-screen-orientation";
import OrientationConfig from "@/src/components/OrientationConfig";
import StatusBarConfig from "@/src/components/StatusBarConfig";

export default function BanknoteInfo() {
  const router = useRouter();
  const {nightMode} = useAppSettingsStore();
  const backgroundColor = nightMode ? '#1C1C1E' : '#FFFFFF';
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const description = String(params.description);
  const textColor = nightMode ? '#FFFFFF' : '#00000';

  function openCamera() {
    router.dismissAll();
  }

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: backgroundColor,
        paddingBottom: insets.bottom
      }
    ]}>
      <OrientationConfig orientationForLock={OrientationLock.PORTRAIT_UP}/>
      <StatusBarConfig/>

      <ScrollView
        style={styles.container}
      >
        <AccessibilityButton
          text={accessibilityStrings.res.recognize_button}
          onPress={() => openCamera()}/>

        <View style={[
          styles.textContainer
        ]}>
          <Text style={[
            { color: textColor,
              fontSize: 35 }
          ]}>
            {description}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textContainer: {
    padding: 20
  },
});
import React from 'react';
import {
    View,
    StyleSheet,
    StatusBar
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {OrientationLock} from "expo-screen-orientation";
import OrientationConfig from "@/src/components/OrientationConfig";
import StatusBarConfig from "@/src/components/StatusBarConfig";

export default function Settings() {
  const {nightMode} = useAppSettingsStore();
  const backgroundColor = nightMode ? '#1C1C1E' : '#FFFFFF';
  const insets = useSafeAreaInsets();

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
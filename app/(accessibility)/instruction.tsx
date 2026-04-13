import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar, Linking, TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {accessibilityStrings} from "@/src/locales/accesibilityStrings";
import AccessibilityButton from "@/src/components/AccessibilityButton";
import {OrientationLock} from "expo-screen-orientation";
import OrientationConfig from "@/src/components/OrientationConfig";
import StatusBarConfig from "@/src/components/StatusBarConfig";

export default function Instruction() {
  const {nightMode} = useAppSettingsStore();
  const backgroundColor = nightMode ? '#1C1C1E' : '#FFFFFF';
  const textColor = nightMode ? '#FFFFFF' : '#00000';

  const insets = useSafeAreaInsets();
  const openLink = (url: string) => {
    Linking.openURL(url).then(); // Функция открытия ссылки
  };

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
        <View style={[
          styles.textContainer
        ]}>
          <Text style={[
            { color: textColor,
              fontSize: 35 }
          ]}>
            {accessibilityStrings.res.instruction_lines}
          </Text>
        </View>

        <AccessibilityButton
          text={accessibilityStrings.res.open_license_agreement_link}
          numberOfLines={3}
          onPress={() => openLink('http://cbr.ru/about/tech/license/')}/>
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
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    fontSize: 50
  },
});
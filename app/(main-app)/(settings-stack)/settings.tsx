import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Linking,
  Platform, TouchableOpacity, Image, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import SettingItem from '@/src/components/SettingItem';
import SwitchItem from '@/src/components/SwitchItem';
import { useAppSettingsStore } from '@/src/services/AppSettingsService';
import { useTranslation } from 'react-i18next';
import PageTitle from "@/src/components/PageTitle";
import {AppColors} from "@/src/constants/appColors";
import PageWithTitle from "@/src/components/PageWithTitle";
import {DefaultBackground} from "@/src/components/DefaultBackground";
import OrientationConfig from "@/src/components/OrientationConfig";



export default function SettingsScreen() {
  const router = useRouter();
  const {t} = useTranslation();
  const {
    language,
    orientation,
    nightMode,
    tipsEnabled,
    audioRecognition,
    toggleNightMode,
    toggleTips,
    toggleAudioRecognition,
  } = useAppSettingsStore();

  const nightModeMode = nightMode;

  const getLanguageDisplay = () => {
    switch (language) {
      case 'auto':
        return t('settings.languages.auto');
      case 'rus':
        return t('settings.languages.russian');
      case 'eng':
        return t('settings.languages.english');
      default:
        return t('settings.languages.auto');
    }
  };

  const getOrientationDisplay = () => {
    switch (orientation) {
      case 'auto':
        return t('settings.orientation.auto');
      case 'portrait':
        return t('settings.orientation.portrait');
      case 'landscape':
        return t('settings.orientation.landscape');
      default:
        return t('settings.orientation.auto');
    }
  };

  const handleNotificationsPress = useCallback(async () => {
    if (Platform.OS === 'android') {
      const {status} = await Notifications.getPermissionsAsync();

      if (status !== 'granted') {
        const {status: newStatus} = await Notifications.requestPermissionsAsync();

        if (newStatus === 'granted') {
          Alert.alert(t('settings.notifications.success'), t('settings.notifications.enabled'));
        } else {
          Alert.alert(
            t('settings.notifications.permissionDenied'),
            t('settings.notifications.openSettings'),
            [
              {text: t('common.cancel'), style: 'cancel'},
              {text: t('common.openSettings'), onPress: () => Linking.openSettings()}
            ]
          );
        }
      } else {
        Linking.openSettings();
      }
    } else {
      Linking.openSettings();
    }
  }, [t]);

  return (
    <View style={{flex: 1}}>
      <OrientationConfig/>
      <PageWithTitle
        title={<PageTitle title={t('settings.title')}/>}
        background={<DefaultBackground/>}
        content={
          <ScrollView
            style={styles.content}
          >
            <View style={[
              styles.section,
              {
                borderTopColor: nightMode ? '#ffffff50' : '#00000050',
              }
            ]}>
              <SettingItem
                title={t('settings.language')}
                value={getLanguageDisplay()}
                onPress={() => router.push('/language')}
                nightMode={nightModeMode}
              />
              <SettingItem
                title={t('settings.orientation.title')}
                value={getOrientationDisplay()}
                onPress={() => router.push('/orientation')}
                nightMode={nightModeMode}
              />
              <SettingItem
                title={t('settings.notifications.title')}
                onPress={handleNotificationsPress}
                showChevron={false}
                nightMode={nightModeMode}
              />
              <SwitchItem
                title={t('settings.nightMode')}
                value={nightMode}
                onValueChange={toggleNightMode}
                nightMode={nightModeMode}
              />
              <SwitchItem
                title={t('settings.tips')}
                value={tipsEnabled}
                onValueChange={toggleTips}
                nightMode={nightModeMode}
              />
              <SwitchItem
                title={t('settings.audioRecognition')}
                value={audioRecognition}
                onValueChange={toggleAudioRecognition}
                nightMode={nightModeMode}
              />
            </View>
          </ScrollView>
        }/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    borderTopWidth: 0.5,
  },
});

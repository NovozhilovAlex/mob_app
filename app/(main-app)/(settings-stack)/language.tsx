import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppSettingsStore, Language } from '@/src/services/AppSettingsService';
import { useTranslation } from 'react-i18next';
import {AppColors} from "@/src/constants/appColors";
import PageTitle from "@/src/components/PageTitle";
import {DefaultBackground} from "@/src/components/DefaultBackground";
import PageWithTitle from "@/src/components/PageWithTitle";
import OrientationConfig from "@/src/components/OrientationConfig";

export default function LanguageModal() {
  const router = useRouter();
  const {nightMode, language: currentLanguage, setLanguage} = useAppSettingsStore();
  const {t} = useTranslation();

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLanguage);

  const languages = [
    {
      id: 'auto',
      label: t('settings.languages.auto'),
      value: 'auto' as const,
    },
    {
      id: 'ru',
      label: t('settings.languages.russian'),
      value: 'rus' as const,
    },
    {
      id: 'en',
      label: t('settings.languages.english'),
      value: 'eng' as const,
    },
  ];

  const handleSelectLanguage = (language: typeof languages[0]) => {
    setSelectedLanguage(language.value);
    setLanguage(language.value);
    setTimeout(() => router.back(), 300);
  };

  return (
    <View style={{flex: 1}}>
      <OrientationConfig/>
      <PageWithTitle
        title={<PageTitle title={t('settings.language')}/>}
        background={<DefaultBackground/>}
        content={
          <ScrollView
            style={styles.content}
          >
            <View style={[
              styles.languageList,
              {
                borderTopColor: nightMode ? '#ffffff50' : '#00000050',
              }
            ]}>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.id}
                  style={[
                    styles.languageItem,
                    {
                      borderBottomColor: nightMode ? '#ffffff50' : '#00000050'
                    }
                  ]}
                  onPress={() => handleSelectLanguage(language)}
                >
                  <View style={styles.languageLeft}>
                    <View style={[
                      styles.radioButton,
                      {
                        borderColor: nightMode ? '#ffffff' : '#000000',
                      }
                    ]}>
                      {selectedLanguage === language.value && (
                        <View
                          style={[
                            styles.radioButtonSelected,
                            {backgroundColor: nightMode ? '#ffffff' : '#000000'}
                          ]}/>
                      )}
                    </View>
                    <View style={styles.languageTextContainer}>
                      <Text style={[
                        styles.languageText,
                        {color: nightMode ? '#ffffff' : '#000000'}
                      ]}>
                        {language.label}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
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
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  titleContainer: {
    minWidth: 60,
    textAlign: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  languageList: {
    borderTopWidth: 0.5,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  radioButton: {
    width: 30,
    height: 30,
    borderRadius: 30,
    borderWidth: 3,
    marginRight: 20,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 12,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

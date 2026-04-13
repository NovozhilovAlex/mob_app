import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

export type Language = 'auto' | 'rus' | 'eng';
export type Orientation = 'auto' | 'portrait' | 'landscape';

interface AppSettingsState {
  // Настройки приложения
  language: Language;
  orientation: Orientation;

  // Настройки уведомлений (чекбоксы)
  nightMode: boolean;
  tipsEnabled: boolean;
  audioRecognition: boolean;

  // Действия
  setLanguage: (language: Language) => void;
  setOrientation: (orientation: Orientation) => void;
  toggleNightMode: () => void;
  toggleTips: () => void;
  toggleAudioRecognition: () => void;

  // Вспомогательные функции
  getCurrentLanguage: () => 'rus' | 'eng';

  // Соглашения
  isLicenseAgreementAccepted: boolean;
  acceptLicenseAgreement: () => void;
  notAcceptLicenseAgreement: () => void;
}

// Функция для определения языка системы с правильной типизацией
const getSystemLanguage = (): 'rus' | 'eng' => {
  try {
    // Получаем массив локалей пользователя
    const locales = getLocales();

    // Гарантированно содержит хотя бы 1 элемент
    if (locales && locales.length > 0) {
      const primaryLocale = locales[0];

      // Проверяем languageCode (предпочтительный способ)
      if (primaryLocale.languageCode?.toLowerCase() === 'ru') {
        return 'rus';
      }

      // Проверяем languageTag как запасной вариант
      if (primaryLocale.languageTag?.toLowerCase().startsWith('ru')) {
        return 'rus';
      }

      // Также можем проверить regionCode для некоторых случаев
      if (primaryLocale.regionCode?.toLowerCase() === 'ru') {
        return 'rus';
      }
    }
  } catch (error) {
    console.log('Error detecting system language:', error);
  }

  // По умолчанию английский
  return 'eng';
};

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set, get) => ({
      // Начальные значения
      language: 'auto',
      orientation: 'auto',
      nightMode: false,
      tipsEnabled: true,
      audioRecognition: false,
      isLicenseAgreementAccepted: false,

      // Действия
      setLanguage: (language) => set({ language }),
      setOrientation: (orientation) => set({ orientation }),
      toggleNightMode: () => set((state) => ({ nightMode: !state.nightMode })),
      toggleTips: () => set((state) => ({ tipsEnabled: !state.tipsEnabled })),
      toggleAudioRecognition: () => set((state) => ({ audioRecognition: !state.audioRecognition })),
      acceptLicenseAgreement: () => set(() => ({ isLicenseAgreementAccepted: true })),
      notAcceptLicenseAgreement: () => set(() => ({ isLicenseAgreementAccepted: false })),

      // Получить актуальный язык (с учетом авто)
      getCurrentLanguage: () => {
        const { language } = get();
        if (language === 'auto') {
          return getSystemLanguage();
        }
        return language;
      },
    }),
    {
      name: 'app-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

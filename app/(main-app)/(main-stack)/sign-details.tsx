import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {useRouter, useLocalSearchParams, useNavigation} from 'expo-router';
import {useAppSettingsStore} from '@/src/services/AppSettingsService';
import {useModificationContextStore} from '@/src/services/ModificationContextService';
import {Sign, ModificationWithDetails} from '@/src';
import SignBanknote3DView from '@/src/components/SignBanknote3DView';
import {DrawerActions} from "@react-navigation/native";
import {useTranslation} from "react-i18next";
import TextInfoWithAudio from "@/src/components/TextInfoWithAudio";
import PageWithTitle from "@/src/components/PageWithTitle";
import PageTitle from "@/src/components/PageTitle";
import FullScreenGradient from "@/src/components/FullScreenGradient";
import ManualModeTitle from "@/src/components/ManualModeTitle";
import OrientationConfig from "@/src/components/OrientationConfig";

// Включение LayoutAnimation для Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type FeatureMode = 'animation' | 'manual'; // Режим отображения признаков

// Типы знаков для фильтрации и получения иконок
const SIGN_TYPE_GROUPS = {
  LUMEN: {code: 'lumen', name: 'signs.names.lumen', manualModeName: 'signs.manualModeNames.lumen', icon: require('@/assets/Image/Resources/Icons/Actions/ActionLight.png')},
  LOUPE: {code: 'loupe', name: 'signs.names.loupe', manualModeName: 'signs.manualModeNames.loupe', icon: require('@/assets/Image/Resources/Icons/Actions/ActionLoupe.png')},
  INCLINE: {code: 'incline', name: 'signs.names.incline', manualModeName: 'signs.manualModeNames.incline', icon: require('@/assets/Image/Resources/Icons/Actions/ActionIncline.png')},
  TOUCH: {code: 'touch', name: 'signs.names.touch', manualModeName: 'signs.manualModeNames.touch', icon: require('@/assets/Image/Resources/Icons/Actions/ActionTouch.png')}
} as const;

export default function SignDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {language, nightMode} = useAppSettingsStore();
  const {setModificationContext} = useModificationContextStore();
  const navigation = useNavigation();
  const {t} = useTranslation();

  // Состояния данных
  const [selectedModification, setSelectedModification] = useState<ModificationWithDetails | null>(null);
  const [allSigns, setAllSigns] = useState<Sign[]>([]);
  const [currentSign, setCurrentSign] = useState<Sign | null>(null);
  const [currentSide, setCurrentSide] = useState<'obverse' | 'reverse'>(params.currentSide as ('obverse' | 'reverse'));
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [featureMode, setFeatureMode] = useState<FeatureMode>('animation');

  // Параметры из навигации
  const allSignsData = params.allSignsData ? JSON.parse(params.allSignsData as string) : null;
  const signId = Number(params.signId);
  const signData = params.signData ? JSON.parse(params.signData as string) : null;
  const initialSide = params.currentSide as 'obverse' | 'reverse';
  const modificationId = Number(params.modificationId);
  const modificationData = params.modificationData ? JSON.parse(params.modificationData as string) : null;
  const nominalId = Number(params.nominalId);
  const nominalValue = params.nominalValue as string;

  const hasSavedContext = useRef(false);

  // Инициализация данных
  useEffect(() => {
    if (modificationData && allSignsData && signData) {
      setAllSigns(allSignsData);
      setCurrentSign(signData);
      setCurrentSide(initialSide);
      setSelectedModification(modificationData);
    }
  }, [modificationData, allSignsData, signData]);

  // Сохранение контекста
  useEffect(() => {
    if (modificationId && nominalId && !hasSavedContext.current) {
      setModificationContext(modificationId, nominalId, currentSide, nominalValue);
      hasSavedContext.current = true;
    }
    return () => { hasSavedContext.current = false; };
  }, [modificationId, nominalId, currentSide, nominalValue]);

  // Функция плавного переключения режима признаков
  const setFeatureModeWithAnimation = (mode: 'animation' | 'manual') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFeatureMode(mode);
  };

  // Обработчик нажатия назад
  const handleBack = () => router.back();

  // Получение названия типа знака на текущем языке
  const getSignTypeName = (): string => {
    if (!currentSign?.sign_type?.sign_type_code) return '';

    const typeCode = currentSign.sign_type.sign_type_code.toLowerCase();
    for (const group of Object.values(SIGN_TYPE_GROUPS)) {
      if (group.code === typeCode) {
        return t(group.name);
      }
    }

    return typeCode;
  };

  // Получение иконки типа знака
  const getSignTypeIcon = (): any => {
    if (!currentSign?.sign_type?.sign_type_code) return null;
    const typeCode = currentSign.sign_type.sign_type_code.toLowerCase();
    for (const group of Object.values(SIGN_TYPE_GROUPS)) {
      if (group.code === typeCode) {
        return group.icon;
      }
    }
    return null;
  };

  // Текст для верхней строки в manual-режиме
  const getManualHeaderText  = (): string => {
    if (!currentSign?.sign_type?.sign_type_code) return '';

    const typeCode = currentSign.sign_type.sign_type_code.toLowerCase();
    for (const group of Object.values(SIGN_TYPE_GROUPS)) {
      if (group.code === typeCode) {
        return t(group.manualModeName);
      }
    }

    return typeCode;
  };

  const menuPress = () => navigation.dispatch(DrawerActions.openDrawer());

  return (
    <View style={styles.container}>
      { featureMode === 'animation'
        ? (<OrientationConfig/>)
        : (<OrientationConfig isLockCurrentOrientation={true}/>) }

      <PageWithTitle
        title={featureMode === 'animation'
          ? <PageTitle isMenuEnable={true} title={getSignTypeName()}/>
          : <ManualModeTitle title={getManualHeaderText()}
                             icon={getSignTypeIcon()}
                             onClosePress={() => setFeatureModeWithAnimation('animation')}/> }
        background={<FullScreenGradient/>}
        ignoreSafeAreaForContent={true}
        statusBarStyle={ featureMode === 'animation'
          ? undefined
          : 'light-text'
        }
        content={
          <View style={styles.container}>
            {/* Контейнер для банкноты */}
            <View style={styles.contentContainer}>

              {/* Основной контент (банкнота) */}
              <View style={styles.banknoteWrapper}>
                {/* 3D компонент банкноты */}
                <SignBanknote3DView
                  typeCode={currentSign?.sign_type?.sign_type_code}
                  banknoteSigns={allSigns}
                  currentSign={currentSign!}
                  currentSide={currentSide}
                  selectedModification={selectedModification!}
                  onSignChange={setCurrentSign}
                  featureMode={featureMode}
                  onInfoButtonPress={() => setShowInfoModal(true)}
                  onFeatureModeChange={setFeatureModeWithAnimation}
                />
              </View>
            </View>


          </View>
        }
      />

      {/* Модальное окно информации о знаке */}
      {showInfoModal && currentSign && (
        <View style={{
          width:'100%',
          height: '100%',
          position:'absolute',
          overflow: 'hidden',
          zIndex: 2000
        }}>
          <TextInfoWithAudio
            titleId={currentSign.name_res?.id}
            titleRus={currentSign.name_res?.rus_string}
            titleEng={currentSign.name_res?.eng_string}

            descriptionId={currentSign.description_res?.id}
            descriptionRus={currentSign.description_res?.rus_string}
            descriptionEng={currentSign.description_res?.eng_string}

            isVisible={showInfoModal}
            onClose={() => setShowInfoModal(false)}
          />

        </View>
      )}
    </View>
  );
}

// Стили компонента
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    left: 0,
    top: 0,
    right: 0,
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 18,
    zIndex: 2,
    height: 120,
  },
  headerContent: {
    marginTop: 36,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 12,
    borderRadius: 30,
  },
  headerIcon: {
    width: 32,
    height: 32,
  },
  headerIconSmall: {
    width: 24,
    height: 24,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  iconPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  banknoteWrapper: {
    flex: 1,
    position: 'relative',
  },
});
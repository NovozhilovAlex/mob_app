import React, {useEffect, useState, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView, Animated, Easing, Image,
} from 'react-native';
import {useRouter, useLocalSearchParams, useNavigation} from 'expo-router';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppSettingsStore} from '@/src/services/AppSettingsService';
import {useModificationStore} from '@/src/services/ModificationService';
import {useSignStore} from '@/src/services/SignService';
import Banknote3DView from '@/src/components/Banknote3DView';
import {ModificationWithDetails} from '@/src';
import TextInfoWithAudio from "@/src/components/TextInfoWithAudio";
import {DrawerActions} from "@react-navigation/native";
import {AppColors} from "@/src/constants/appColors";
import {useTranslation} from "react-i18next";
import PageTitle from "@/src/components/PageTitle";
import FullScreenGradient from "@/src/components/FullScreenGradient";
import PageWithTitle from "@/src/components/PageWithTitle";
import OrientationConfig from "@/src/components/OrientationConfig";

export default function ModificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const navigation = useNavigation();

  const { t } = useTranslation();
  const {language, nightMode} = useAppSettingsStore();
  const insets = useSafeAreaInsets();

  const modificationId = Number(params.modificationId);
  const side = Number(params.side);

  const {
    modificationsWithDetails,
    error: modError,
    loadModificationsWithDetailsByModificationId,
    clearError: clearModError,
  } = useModificationStore();

  const {
    signsWithDetails,
    error: signError,
    loadSignsWithDetails,
    clearError: clearSignError,
    clearSigns,
    cancelPendingRequests
  } = useSignStore();

  const [selectedModification, setSelectedModification] = useState<ModificationWithDetails | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  // Анимации
  const pickerSlideAnim = useRef(new Animated.Value(0)).current;
  const arrowRotateAnim = useRef(new Animated.Value(0)).current;

  // Сортировка модификаций от меньшего года к большему
  const sortedModifications = useMemo(() => {
    return [...modificationsWithDetails].sort((a, b) => {
      if (!a.modification_year && !b.modification_year) return 0;
      if (!a.modification_year) return 1;
      if (!b.modification_year) return -1;
      return a.modification_year - b.modification_year; // Изменено с b - a на a - b
    });
  }, [modificationsWithDetails]);

  // Загрузка модификаций
  useEffect(() => {
    if (modificationId) {
      loadModifications().then();
    }
  }, [modificationId]);

  // Выбор модификации
  useEffect(() => {
    if (sortedModifications.length > 0) {
      let modToSelect: ModificationWithDetails | null = null;

      if (!modToSelect) {
        // Выбираем ПОСЛЕДНИЙ элемент в массиве (самый большой год)
        modToSelect = sortedModifications.find(mod => mod.modification_id === modificationId) || null;
      }

      if (modToSelect) {
        setSelectedModification(modToSelect);
        loadSignsForModification(modToSelect.modification_id).then();
      }
    }
  }, [sortedModifications]);

  // Обновление знаков при смене модификации
  useEffect(() => {
    if (selectedModification) {
      loadSignsForModification(selectedModification.modification_id).then();
    }
  }, [selectedModification, language]);

  // Функции
  const loadModifications = async () => {
    await loadModificationsWithDetailsByModificationId(modificationId);
  };

  const loadSignsForModification = async (modificationId: number) => {
    try {
      await loadSignsWithDetails(modificationId);
    } catch (error) {
      console.error('Ошибка загрузки знаков:', error);
    }
  };

  const handleRetry = () => {
    clearModError();
    clearSignError();
    loadModifications().then();
  };

  const toggleYearPicker = () => {
    const toValue = isYearPickerOpen ? 0 : 1;

    Animated.parallel([
      Animated.timing(pickerSlideAnim, {
        toValue,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(arrowRotateAnim, {
        toValue,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    setIsYearPickerOpen(!isYearPickerOpen);
  };

  const handleYearSelect = (modificationId: number) => {
    const mod = sortedModifications.find(m => m.modification_id === modificationId);
    if (mod) {
      if (selectedModification?.modification_id !== mod?.modification_id) {
        cancelPendingRequests();
        clearSigns();
        setSelectedModification(mod);
        toggleYearPicker(); // Закрываем панель
      } else {
        toggleYearPicker(); // Закрываем панель
      }
    }
  };

  const menuPress = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Поворот стрелки
  const arrowRotation = arrowRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Высота панели для анимации
  const panelHeight = 40; // Примерная высота панели

  // Обработчики ошибок и состояний загрузки
  if (modError || signError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Ошибка: {modError || signError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <OrientationConfig/>
      <PageWithTitle title={<PageTitle title={`${selectedModification?.nominal_value} ${t("common.rubles")}`}
                                       isMenuEnable={true}
                                       isCloseDisable={true}
                                       rightElement={
                                         <TouchableOpacity
                                           onPress={toggleYearPicker}
                                           style={[styles.yearSelector]}
                                           activeOpacity={0.7}
                                         >
                                           <Text style={[styles.selectedYearText, {
                                             color: nightMode ? '#FFFFFF' : '#000000',
                                             marginRight: 12
                                           }]}>
                                             {selectedModification?.modification_year}
                                           </Text>
                                           <Animated.Image
                                             source={require('@/assets/Image/Resources/Icons/DropDownIcon.png')}
                                             style={[
                                               styles.dropdownIcon,
                                               {
                                                 tintColor: nightMode ? '#FFFFFF' : '#000000',
                                                 transform: [{rotate: arrowRotation}]
                                               }
                                             ]}
                                             resizeMode="contain"
                                           />
                                         </TouchableOpacity>

                                       }/>}
                     background={<FullScreenGradient/>}
                     ignoreSafeAreaForContent={true}
                     content={
                       <View style={{width:'100%', height:'100%'}}>
                         <View style={styles.contentContainer}>
                           {/* Выпадающая панель с годами - изначально скрыта под хедером */}
                           <Animated.View
                             style={[
                               styles.yearPickerPanel,
                               {
                                 backgroundColor: nightMode ? AppColors.dark.bgColor : AppColors.light.bgColor,
                                 transform: [{
                                   translateY: pickerSlideAnim.interpolate({
                                     inputRange: [0, 1],
                                     outputRange: [-panelHeight, 0] // При 0 - скрыта под хедером, при 1 - показана
                                   })
                                 }],
                                 opacity: pickerSlideAnim.interpolate({
                                   inputRange: [0, 1],
                                   outputRange: [0, 1]
                                 }),
                                 paddingLeft: insets.left,
                                 paddingRight: insets.right,
                                 shadowColor: '#000000',
                               }
                             ]}
                           >
                             <ScrollView
                               horizontal
                               showsHorizontalScrollIndicator={false}
                               contentContainerStyle={styles.yearPickerContent}
                             >
                               {sortedModifications.map((mod) => (
                                 <TouchableOpacity
                                   key={mod.modification_id}
                                   style={[
                                     styles.yearButton,
                                   ]}
                                   onPress={() => handleYearSelect(mod.modification_id)}
                                 >
                                   <Text style={[
                                     styles.yearButtonText,
                                     {
                                       color: nightMode ? '#FFFFFF' : '#000000',
                                     },
                                     selectedModification?.modification_id === mod.modification_id && {
                                       fontWeight: 'bold',
                                     }
                                   ]}>
                                     {mod.modification_year}
                                   </Text>
                                 </TouchableOpacity>
                               ))}
                             </ScrollView>
                           </Animated.View>

                           {/* Основной контент (банкнота) */}
                           <View style={styles.banknoteWrapper}>
                             {/* Банкнота занимает все оставшееся пространство */}
                             <View style={styles.banknoteContainer}>
                               {selectedModification && (
                                 <Banknote3DView
                                   selectedModification={selectedModification}
                                   banknoteSigns={signsWithDetails}
                                   onInfoButtonPress={() => setShowInfoModal(true)}
                                 />
                               )}
                             </View>
                           </View>
                         </View>
                       </View>
                     }>
      </PageWithTitle>


        {/* Модальное окно с информацией */}
        {selectedModification && showInfoModal && (
          <View style={{
            width:'100%',
            height: '100%',
            position:'absolute',
            overflow: 'hidden',
            zIndex: 2000
          }}>
            <TextInfoWithAudio
              // selectedModification={selectedModification}
              titleId={selectedModification.modification_fullname}
              titleRus={selectedModification.fullname_rus}
              titleEng={selectedModification.fullname_eng}

              descriptionId={selectedModification.modification_description}
              descriptionRus={selectedModification.description_rus}
              descriptionEng={selectedModification.description_eng}

              isVisible={showInfoModal}
              onClose={() => setShowInfoModal(false)}
            />

          </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  banknoteContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    zIndex: 2,
  },
  titleContainer: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
    lineHeight: 24,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectedYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  dropdownIcon: {
    width: 16,
    height: 16,
  },
  container: {
    flex: 1,
    position: 'relative'
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden', // Чтобы скрыть панель когда она под хедером
  },
  yearPickerPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 1,
  },
  yearPickerContent: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-around',
    gap: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },
  yearButton: {
    backgroundColor: 'transparent',
    height: 22
  },
  yearButtonText: {
    fontSize: 18,
    fontWeight: '400',
  },
  banknoteWrapper: {
    flex: 1,
    position: 'relative',
    marginTop: 0, // Панель будет поверх, но скрыта
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
});

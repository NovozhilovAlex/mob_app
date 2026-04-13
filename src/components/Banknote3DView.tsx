import React, {useState, useRef, useEffect, useMemo, useCallback} from 'react'; // Добавляем useCallback
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Easing,
  LayoutChangeEvent,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import IMAGE_MAP, {findImageInMap} from "@/src/utils/imageMap";
import {dataCacheService} from "@/src/services/DataCacheService";
import {Sign} from "@/src";
import {useAppSettingsStore} from '@/src/services/AppSettingsService';
import {AppColors} from "@/src/constants/appColors";
import {useTranslation} from "react-i18next";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useCustomOrientation} from "@/src/hooks/useCustomOrientation";

const {width: screenWidth} = Dimensions.get('window');
const ROTATION_DURATION = 1200;

const DEFAULT_PERSPECTIVE = 1000;

// ========== КОНСТАНТА ДЛЯ ВЫСОТЫ НИЖНЕЙ ПАНЕЛИ ==========
const BOTTOM_FILTER_PANEL_HEIGHT = 64; // Высота панели с кнопками фильтрации (в пикселях)

// Типы знаков для фильтрации
const SIGN_TYPE_GROUPS = {
  LUMEN: {
    code: 'lumen',
    nameRes: 'signs.names.lumen'
  },
  LOUPE: {
    code: 'loupe',
    nameRes: 'signs.names.loupe'
  },
  INCLINE: {
    code: 'incline',
    nameRes: 'signs.names.incline'
  },
  TOUCH: {
    code: 'touch',
    nameRes: 'signs.names.touch'
  }
} as const;

type SignTypeCode = keyof typeof SIGN_TYPE_GROUPS;

interface SignPoint {
  sign_id: number;
  x: number;
  y: number;
  radius: number;
  sign_name_text?: string;
  sign_description_text?: string;
  sign_type_code?: string;
  res_path?: string;
}

interface Banknote3DViewProps {
  selectedModification: any;
  banknoteSigns: Sign[];
  onInfoButtonPress?: () => void;
}

export default function Banknote3DView({
                                         selectedModification,
                                         banknoteSigns,
                                         onInfoButtonPress,
                                       }: Banknote3DViewProps) {
  const router = useRouter();
  const {getCurrentLanguage, nightMode} = useAppSettingsStore();

  const insets = useSafeAreaInsets();
  const orientation = useCustomOrientation();
  // Состояние для динамических размеров
  const [containerSize, setContainerSize] = useState({
    width: screenWidth,
    height: 0
  });

  const {t} = useTranslation();
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // Состояния
  const [rotationAnim] = useState(new Animated.Value(0));
  const [shadowAnim] = useState(new Animated.Value(1)); // Анимация для тени
  const isRotating = useRef(false);
  const [displaySide, setDisplaySide] = useState<'obverse' | 'reverse'>('obverse');
  const [pictures, setPictures] = useState<{ obverse?: any; reverse?: any }>({});
  const [isLoadingPictures, setIsLoadingPictures] = useState(false);

  // Состояние для активного типа знака для каждой стороны
  const [activeSignTypeObverse, setActiveSignTypeObverse] = useState<SignTypeCode | null>(null);
  const [showSignPoints, setShowSignPoints] = useState(true);

  const currentRotationRef = useRef(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isMountedRef = useRef(false);
  const targetSideRef = useRef<'obverse' | 'reverse'>('obverse');
  const isLandscapeRef = useRef(false); // Ref для хранения ориентации

  // Ref для отслеживания displaySide
  const displaySideRef = useRef(displaySide);

  // ========== НОВЫЙ ОБРАБОТЧИК ИЗМЕНЕНИЯ РАЗМЕРОВ С ВЫЧЕТОМ ПАНЕЛИ ==========
  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    // Только если размеры валидны
    if (width > 0 && height > 0) {
      // ВАЖНО: Вычитаем высоту нижней панели фильтрации (72px)
      // Это гарантирует, что банкнота не будет наезжать на панель
      const availableHeight = height - BOTTOM_FILTER_PANEL_HEIGHT - 28;

      setContainerSize({
        width,
        height: availableHeight // Сохраняем доступную высоту
      });

      if (!isLayoutReady) {
        setIsLayoutReady(true);
      }

      console.log(`Banknote3DView: доступная высота после вычета панели: ${availableHeight}px`);
    }
  }, [isLayoutReady]);

  // Обновляем ref при изменении displaySide
  useEffect(() => {
    displaySideRef.current = displaySide;
  }, [displaySide]);

  // Функция для обработки нажатия на кнопку информации
  const handleInfoButtonPress = () => {
    if (onInfoButtonPress) {
      onInfoButtonPress();
    }
  };

  // Функция для определения и обновления ориентации
  const updateLandscapeRef = () => {
    if (selectedModification) {
      const {bnk_size_width, bnk_size_height} = selectedModification;
      isLandscapeRef.current = orientation === 'PORTRAIT'
        ? bnk_size_width > bnk_size_height
        : bnk_size_width < bnk_size_height
    }
  };

  // Вычисляем угол поворота для изображения на основе ref
  const getImageRotation = () => {
    return isLandscapeRef.current ? '90deg' : '0deg';
  };

  // Сброс состояний при смене модификации
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
    } else {
      // Сброс состояний при смене модификации
      setDisplaySide('obverse');
      setActiveSignTypeObverse(null);
      setShowSignPoints(true);
      setPictures({});
      rotationAnim.setValue(0);
      shadowAnim.setValue(1); // Сбрасываем анимацию тени
      currentRotationRef.current = 0;
      isRotating.current = false;
    }
  }, [selectedModification?.modification_id]);

  // Обновляем ref ориентации при изменении selectedModification
  useEffect(() => {
    if (selectedModification) {
      updateLandscapeRef();
      loadPictures().then();
    }
  }, [selectedModification, orientation]);

  // Инициализация фильтров для обеих сторон при загрузке знаков
  useEffect(() => {
    if (banknoteSigns.length > 0) {
      const obverseType = getFirstAvailableSignType('obverse');

      setActiveSignTypeObverse(obverseType);
    }
  }, [banknoteSigns]);

  // Функция для получения первого доступного типа знаков для конкретной стороны
  const getFirstAvailableSignType = (side: 'obverse' | 'reverse'): SignTypeCode | null => {
    // Получаем знаки для указанной стороны
    const sideNumber = side === 'obverse' ? 1 : 2;
    const filteredSigns = banknoteSigns.filter(sign =>
      sign.sign_side === sideNumber &&
      (!sign.is_hide || sign.is_hide === 0)
    );

    if (filteredSigns.length === 0) return null;

    // Ищем первый тип, который есть в SIGN_TYPE_GROUPS и присутствует у знаков
    for (const [typeKey, typeData] of Object.entries(SIGN_TYPE_GROUPS)) {
      const hasType = filteredSigns.some(sign =>
        sign.sign_type?.sign_type_code?.toLowerCase() === typeData.code
      );

      if (hasType) {
        return typeKey as SignTypeCode;
      }
    }

    return null;
  };

  // Получаем активный тип для текущей стороны
  const getActiveSignTypeForCurrentSide = (): SignTypeCode | null => {
    return activeSignTypeObverse;
  };

  // Устанавливаем активный тип для текущей стороны
  const setActiveSignTypeForCurrentSide = (type: SignTypeCode | null) => {
    setActiveSignTypeObverse(type);
  };

  const loadPictures = async () => {
    setIsLoadingPictures(true);
    try {
      // Используем кеш для получения изображений
      const picturesData = dataCacheService.getPicturesByModification(
        selectedModification.modification_id
      );
      setPictures(picturesData);
    } catch (error) {
      console.error('Ошибка загрузки изображений:', error);
    } finally {
      setIsLoadingPictures(false);
    }
  };

  // Фильтрация знаков по текущей стороне и is_hide
  const filteredSigns = useMemo(() =>
      banknoteSigns.filter(sign =>
        sign.sign_side === (displaySide === 'obverse' ? 1 : 2) &&
        (!sign.is_hide || sign.is_hide === 0)
      ),
    [banknoteSigns, displaySide]
  );

  // Получение изображений
  const getCurrentImage = () => {
    const path = displaySide === 'obverse'
      ? pictures.obverse?.pic_a
      : pictures.reverse?.pic_r;
    return path ? findImageInMap(path) : IMAGE_MAP.placeholder;
  };

  const getOppositeImage = () => {
    const path = displaySide === 'obverse'
      ? pictures.reverse?.pic_r
      : pictures.obverse?.pic_a;
    return path ? findImageInMap(path) : IMAGE_MAP.placeholder;
  };

  // Получение размеров банкноты
  const getBanknoteSize = () => {
    if (selectedModification) {
      if (isLandscapeRef.current) {
        return {
          width: selectedModification.bnk_size_width,
          height: selectedModification.bnk_size_height,
          aspectRatio: selectedModification.bnk_size_width / selectedModification.bnk_size_height
        };
      } else {
        return {
          width: selectedModification.bnk_size_height,
          height: selectedModification.bnk_size_width,
          aspectRatio: selectedModification.bnk_size_height / selectedModification.bnk_size_width
        };
      }
    }
    return {width: 150, height: 65, aspectRatio: 150 / 65};
  };

  // ========== ФУНКЦИЯ РАСЧЕТА РАЗМЕРОВ (без изменений, использует containerSize) ==========
  const calculateContainerSize = () => {
    const {aspectRatio} = getBanknoteSize();
    const rotatedAspectRatio = 1 / aspectRatio; // Банкнота повернута на 90 градусов

    // Используем динамические размеры контейнера (уже с вычтенной панелью)
    const maxWidth = containerSize.width;
    const maxHeight = containerSize.height - insets.bottom;

    let width = maxWidth;
    let height = width / rotatedAspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * rotatedAspectRatio;
    }

    return {
      width,
      height,
      scale: width / maxWidth,
    };
  };

  const calculateSignPoints = (signsArray: Sign[]) => {
    return signsArray.map((sign) => {
      let x = sign.sign_x || 0;
      let y = sign.sign_y || 0;

      let rotatedX, rotatedY;

      if (isLandscapeRef.current) {
        // Для ландшафтной ориентации поворачиваем координаты на 90° по часовой стрелке
        rotatedX = x;
        rotatedY = y;
      } else {
        // Коррекция для не повернутой банкноты
        rotatedX = y;
        rotatedY = 1 - x;
      }

      // Получаем путь к первому ресурсу
      let res_path: string | undefined;
      if (sign.all_sign_res && sign.all_sign_res.length > 0) {
        res_path = sign.all_sign_res[0].res_path;
      } else if (sign.sign_res1_data?.res_path) {
        res_path = sign.sign_res1_data.res_path;
      }

      // Получаем название знака на текущем языке
      let sign_name_text: string;
      if (getCurrentLanguage() === 'rus' && sign.name_res?.rus_string) {
        sign_name_text = sign.name_res.rus_string;
      } else if (getCurrentLanguage() === 'eng' && sign.name_res?.eng_string) {
        sign_name_text = sign.name_res.eng_string;
      } else if (sign.name_res?.rus_string) {
        sign_name_text = sign.name_res.rus_string;
      } else if (sign.name_res?.eng_string) {
        sign_name_text = sign.name_res.eng_string;
      } else if (sign.sign_name_str) {
        sign_name_text = sign.sign_name_str;
      } else {
        sign_name_text = getCurrentLanguage() === 'eng' ? `Sign #${sign.sign_id}` : `Знак #${sign.sign_id}`;
      }

      return {
        sign_id: sign.sign_id,
        x: rotatedX,
        y: rotatedY,
        radius: 22,
        sign_name_text,
        sign_description_text: getCurrentLanguage() === 'rus'
          ? sign.description_res?.rus_string
          : sign.description_res?.eng_string,
        sign_type_code: sign.sign_type?.sign_type_code,
        res_path,
      };
    });
  };

  // Проверка, есть ли знаки для каждого типа на текущей стороне
  const hasSignsForType = (typeCode: string): boolean => {
    // Используем знаки текущей стороны
    const currentSigns = filteredSigns;

    // Проверяем, есть ли хотя бы один знак этого типа
    return currentSigns.some(sign =>
      sign.sign_type?.sign_type_code?.toLowerCase() === SIGN_TYPE_GROUPS[typeCode as SignTypeCode].code
    );
  };

  // Функция для переключения типа знака для текущей стороны
  const toggleSignType = (type: SignTypeCode) => {
    if (!hasSignsForType(type) || isRotating.current) return; // Не переключаем, если нет знаков на этой стороне или идет вращение

    const currentActiveType = getActiveSignTypeForCurrentSide();

    if (currentActiveType === type) {
      // Если тип уже активен, сбрасываем фильтр (показываем все знаки)
      setActiveSignTypeForCurrentSide(null);
    } else {
      // Иначе переключаем на выбранный тип для этой стороны
      setActiveSignTypeForCurrentSide(type);
    }
  };

  // Фильтрация точек по активному типу для текущей стороны
  const getFilteredSignPoints = () => {
    if (!showSignPoints) return []; // Не показываем точки во время переворота

    const allPoints = calculateSignPoints(filteredSigns);
    const currentActiveType = getActiveSignTypeForCurrentSide();

    if (!currentActiveType) {
      // Если не выбран тип, показываем все знаки для текущей стороны
      return allPoints;
    }

    const activeTypeCode = SIGN_TYPE_GROUPS[currentActiveType].code;
    return allPoints.filter(point => {
      if (!point.sign_type_code) return false;
      return point.sign_type_code.toLowerCase() === activeTypeCode;
    });
  };

  const signPoints = useMemo(() => {
    return getFilteredSignPoints();
  }, [filteredSigns, displaySide, activeSignTypeObverse, getCurrentLanguage(), showSignPoints, orientation, isLandscapeRef.current ]);

  useEffect(() => {
    const listenerId = rotationAnim.addListener(({value}) => {
      currentRotationRef.current = value;
    });

    return () => {
      rotationAnim.removeListener(listenerId);
    };
  }, [rotationAnim]);

  // Вычисляем размеры только если layout готов
  const containerSizeCalculated = isLayoutReady ? calculateContainerSize() : { width: 0, height: 0, scale: 0 };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isRotating.current,
      onPanResponderGrant: () => {
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (isRotating.current) return;

        if (isLandscapeRef.current) {
          // Для ландшафтной ориентации - вертикальные свайпы
          if (Math.abs(gestureState.dy) > 50) {
            const direction = gestureState.dy > 0 ? 'down' : 'up';
            handleFlip(direction);
          }
        } else {
          // Для портретной ориентации - горизонтальные свайпы
          const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);

          if (isHorizontalSwipe && Math.abs(gestureState.dx) > 50) {
            const direction = gestureState.dx > 0 ? 'right' : 'left';
            handleFlip(direction);
          }
        }
      },
    })
  ).current;

  const handleFlip = (direction: 'left' | 'right' | 'up' | 'down' = 'right') => {
    console.log('handleFlip');
    if (isRotating.current) return;

    // Скрываем точки перед началом анимации
    setShowSignPoints(false);

    // Анимация исчезновения тени
    Animated.timing(shadowAnim, {
      toValue: 0,
      duration: 50,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();

    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    isRotating.current = true;

    // Вычисляем целевую сторону на основе ТЕКУЩЕГО displaySide
    const currentSide = displaySideRef.current;
    const targetSide = currentSide === 'obverse' ? 'reverse' : 'obverse';

    // Сохраняем для использования в callback
    targetSideRef.current = targetSide;

    // Определяем начальную и конечную ротацию
    const currentRotation = currentRotationRef.current;

    let startRotation = currentRotation;
    let endRotation = currentRotation + 180;

    // Настраиваем направление вращения в зависимости от ориентации и направления свайпа
    if (isLandscapeRef.current) {
      // Для ландшафтной ориентации (вертикальные свайпы)
      if (direction === 'up') {
        endRotation = currentRotation + 180;
      } else if (direction === 'down') {
        endRotation = currentRotation - 180;
      }
    } else {
      // Для портретной ориентации (горизонтальные свайпы)
      if (direction === 'left') {
        endRotation = currentRotation - 180;
      } else if (direction === 'right') {
        endRotation = currentRotation + 180;
      }
    }

    // Устанавливаем начальное значение
    rotationAnim.setValue(startRotation);
    currentRotationRef.current = startRotation;

    animationRef.current = Animated.timing(rotationAnim, {
      toValue: endRotation,
      duration: ROTATION_DURATION,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: true,
    });

    animationRef.current.start(({finished}) => {
      if (finished) {
        // Обновляем состояние displaySide
        setDisplaySide(targetSide);

        // Обновляем текущее значение ротации
        currentRotationRef.current = endRotation;

        // Показываем точки
        setShowSignPoints(true);
        isRotating.current = false;
        animationRef.current = null;

        // Анимация появления тени
        Animated.timing(shadowAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.ease,
          useNativeDriver: false,
        }).start();
      } else {
        // Если анимация прервана
        setShowSignPoints(true);
        isRotating.current = false;
        // Восстанавливаем исходную сторону
        setDisplaySide(currentSide);

        // Возвращаем тень
        Animated.timing(shadowAnim, {
          toValue: 1,
          duration: 100,
          easing: Easing.ease,
          useNativeDriver: false,
        }).start();
      }
    });
  };

  const handleFlipButton = () => {
    // Используем актуальное значение из ref
    const currentSide = displaySideRef.current;

    if (isLandscapeRef.current) {
      // Для ландшафтной ориентации - вертикальный флип
      const direction = currentSide === 'obverse' ? 'up' : 'down';
      handleFlip(direction);
    } else {
      // Для портретной ориентации - горизонтальный флип
      const direction = currentSide === 'obverse' ? 'left' : 'right';
      handleFlip(direction);
    }
  };

  const handleSignPointPress = (point: SignPoint) => {
    const sign = banknoteSigns.find(s => s.sign_id === point.sign_id);
    if (sign) {
      const nominalValue = selectedModification.nominal_value ?
        selectedModification.nominal_value.toString() : '';

      router.push({
        pathname: "/sign-details",
        params: {
          allSignsData: JSON.stringify(banknoteSigns),
          signId: sign.sign_id.toString(),
          signData: JSON.stringify(sign),
          currentSide: displaySide,
          modificationId: selectedModification.modification_id.toString(),
          modificationData: JSON.stringify(selectedModification),
          nominalId: selectedModification.nominal_id?.toString() || '',
          nominalValue: nominalValue,
        }
      });
    }
  };

  const getFrontAnimatedStyle = () => {
    if (isLandscapeRef.current) {
      // Для ландшафтной ориентации - вращение по оси X (вертикальные свайпы)
      return {
        transform: [
          {perspective: DEFAULT_PERSPECTIVE},
          {
            rotateX: rotationAnim.interpolate({
              inputRange: [-180, 0, 180],
              outputRange: ['-180deg', '0deg', '180deg'],
            })
          },
        ],
        backfaceVisibility: 'hidden' as const,
      };
    } else {
      // Для портретной ориентации - вращение по оси Y (горизонтальные свайпы)
      return {
        transform: [
          {perspective: DEFAULT_PERSPECTIVE},
          {
            rotateY: rotationAnim.interpolate({
              inputRange: [-180, 0, 180],
              outputRange: ['-180deg', '0deg', '180deg'],
            })
          },
        ],
        backfaceVisibility: 'hidden' as const,
      };
    }
  };

  const getBackAnimatedStyle = () => {
    if (isLandscapeRef.current) {
      // Для ландшафтной ориентации - вращение по оси X (вертикальные свайпы)
      return {
        transform: [
          {perspective: DEFAULT_PERSPECTIVE},
          {
            rotateX: rotationAnim.interpolate({
              inputRange: [-180, 0, 180],
              outputRange: ['0deg', '180deg', '360deg'],
            })
          },
        ],
        backfaceVisibility: 'hidden' as const,
      };
    } else {
      // Для портретной ориентации - вращение по оси Y (горизонтальные свайпы)
      return {
        transform: [
          {perspective: DEFAULT_PERSPECTIVE},
          {
            rotateY: rotationAnim.interpolate({
              inputRange: [-180, 0, 180],
              outputRange: ['0deg', '180deg', '360deg'],
            })
          },
        ],
        backfaceVisibility: 'hidden' as const,
      };
    }
  };

  const currentImage = getCurrentImage();
  const oppositeImage = getOppositeImage();
  const imageRotation = getImageRotation();

  // Получаем активный тип для отображения в UI
  const activeSignTypeForUI = getActiveSignTypeForCurrentSide();

  return (
    // Добавляем onLayout к корневому View
    <View style={[styles.container]} onLayout={onContainerLayout}>
      <View style={styles.banknoteContainer}>
        <View style={styles.banknote3DWrapper} {...panResponder.panHandlers}>
          <Animated.View style={[
            styles.banknote3DView,
            {
              width: containerSizeCalculated.width,
              height: containerSizeCalculated.height,
              shadowOpacity: shadowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3]
              }),
              elevation: shadowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 12]
              }),
            }
          ]}>
            {/* Передняя сторона */}
            <Animated.View style={[styles.banknote3DCard, getFrontAnimatedStyle()]}>
              <View style={[
                styles.imageContainer,
                {
                  width: isLandscapeRef.current ? containerSizeCalculated.height : containerSizeCalculated.width,
                  height: isLandscapeRef.current ? containerSizeCalculated.width : containerSizeCalculated.height,
                  transform: [{rotateZ: imageRotation}]
                }
              ]}>
                {!isLoadingPictures ? (
                  <Image
                    source={displaySide === 'obverse' ? currentImage : oppositeImage}
                    style={styles.banknoteImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholder}>
                    <Ionicons name="image-outline" size={48} color="#ccc"/>
                    <Text style={styles.placeholderText}>
                      {getCurrentLanguage() === 'eng' ? 'Loading...' : 'Загрузка...'}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Задняя сторона */}
            <Animated.View style={[styles.banknote3DCard, getBackAnimatedStyle()]}>
              <View style={[
                styles.imageContainer,
                {
                  width: isLandscapeRef.current ? containerSizeCalculated.height : containerSizeCalculated.width,
                  height: isLandscapeRef.current ? containerSizeCalculated.width : containerSizeCalculated.height,
                  transform: [{rotateZ: imageRotation}]
                }
              ]}>
                {!isLoadingPictures ? (
                  <Image
                    source={displaySide === 'obverse' ? oppositeImage : currentImage}
                    style={styles.banknoteImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholder}>
                    <Ionicons name="image-outline" size={48} color="#ccc"/>
                    <Text style={styles.placeholderText}>
                      {getCurrentLanguage() === 'eng' ? 'Loading...' : 'Загрузка...'}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Точки знаков для текущей стороны */}
            {(showSignPoints && !isRotating.current) && (
              <>
                {signPoints.map((point) => (
                  <TouchableOpacity
                    key={`${point.sign_id}-${displaySide}`}
                    style={[
                      styles.signPointContainer,
                      {
                        left: `${point.x * 100}%`,
                        top: `${point.y * 100}%`,
                        transform: [
                          {translateX: -point.radius},
                          {translateY: -point.radius},
                        ],
                      }
                    ]}
                    onPress={() => handleSignPointPress(point)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.signPointOuter,
                      {
                        width: point.radius * 2,
                        height: point.radius * 2,
                        borderRadius: point.radius,
                        backgroundColor: "#FFF",
                      }
                    ]}>
                      <View style={[
                        styles.signPointInner,
                        {
                          width: point.radius * 0.8,
                          height: point.radius * 0.8,
                          borderRadius: point.radius * 0.4,
                          backgroundColor: "#000",
                        }
                      ]}/>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Круглая кнопка переворота справа */}
            {(showSignPoints && !isRotating.current) && (
              <TouchableOpacity
                style={[
                  styles.flipCircleButton,
                  orientation === 'PORTRAIT'
                    ? styles.flipCircleButtonPositionPortrait
                    : styles.flipCircleButtonPositionLandscape
                ]}
                onPress={handleFlipButton}
                disabled={isRotating.current}
                activeOpacity={0.7}
              >
                <Image
                  source={require('@/assets/Image/Resources/Icons/RotateIcon.png')}
                  style={{
                    width: 28,
                    height: 28,
                    tintColor: '#000000',
                  }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>

        {/* Круглая кнопка информации слева снизу */}
        <TouchableOpacity
          style={[
            styles.infoCircleButton,
            {
              marginLeft: insets.left
            }
          ]}
          onPress={handleInfoButtonPress}
          disabled={isRotating.current}
          activeOpacity={0.7}
        >
          <Image
            source={require('@/assets/Image/Resources/Icons/InfoIcon.png')}
            style={{
              width: 28,
              height: 28,
              tintColor: '#000000',
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Панель фильтрации типов знаков */}
      <View style={[styles.filterContainer, {
        backgroundColor: nightMode ? AppColors.dark.bgColor : AppColors.light.bgColor,
        // Добавляем фиксированную высоту для панели
        height: orientation === 'PORTRAIT' ? 70 + insets.bottom : 40 + insets.bottom
      }]}>
        <View style={[styles.filterButtonsRow, {
          paddingLeft: insets.left,
          paddingBottom: insets.bottom,
          paddingRight: insets.right
        }]}>
          {Object.entries(SIGN_TYPE_GROUPS).map(([key, group]) => {
            const isActive = activeSignTypeForUI === key;
            const hasSigns = hasSignsForType(key);
            const isDisabled = !hasSigns || isRotating.current;

            return (
              <TouchableOpacity
                key={key}
                onPress={() => toggleSignType(key as SignTypeCode)}
                disabled={isDisabled}
                activeOpacity={isDisabled ? 1 : 0.7}
                style={{
                  flex:1,
                  height:'100%',
                  opacity: !isDisabled ? 1 : 0.3,
                }}
              >
                <View style={{
                  width:'100%',
                  height:'100%',
                  justifyContent:'center'}}>
                  <Text style={[
                    styles.filterButtonText,
                    isActive && styles.filterButtonTextActive,
                    isDisabled && styles.filterButtonTextDisabled,
                    {
                      color: nightMode ? AppColors.dark.textColor : AppColors.light.textColor,
                    }
                  ]}>
                    {t(group.nameRes)}
                  </Text>
                  <View style={{
                    position:'absolute',
                    width: '100%',
                    height: '100%'
                  }}>
                    {isActive && !isRotating.current && <View style={[styles.underline,
                      {
                        backgroundColor: nightMode ? AppColors.dark.textColor : AppColors.light.textColor,
                      }]}/>}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  banknoteContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  banknote3DWrapper: {
    position: 'relative',
  },
  banknote3DView: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowRadius: 24,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  banknote3DCard: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backfaceVisibility: 'hidden' as const,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  banknoteImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  signPointContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  signPointOuter: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 8,
  },
  signPointInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipCircleButton: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 20,
  },
  flipCircleButtonPositionPortrait: {
    right: -24,
    top: '50%',
    transform: [{translateY: -24}],
  },
  flipCircleButtonPositionLandscape: {
    top: -24,
    left: '50%',
    transform: [{translateX: -24}],
  },
  infoCircleButton: {
    position: 'absolute',
    left: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 20,
  },
  filterContainer: {},
  filterButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  filterButton: {
    paddingVertical: 22,
    paddingHorizontal: 4,
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonDisabled: {
    opacity: 0.3,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#fff',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    fontWeight: 'bold',
  },
  filterButtonTextDisabled: {
    color: '#aaa',
  },
  underline: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 0,
  },
});
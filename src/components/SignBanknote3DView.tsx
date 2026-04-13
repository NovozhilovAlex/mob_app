import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity, useWindowDimensions,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ChevronLeft, ChevronRight} from 'lucide-react-native';
import Animated, {
  cancelAnimation,
  Easing as ReanimatedEasing,
  runOnJS, SensorType,
  useAnimatedProps, useAnimatedSensor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import IMAGE_MAP, {findImageInMap} from "@/src/utils/imageMap";
import {dataCacheService} from "@/src/services/DataCacheService";
import {ModificationWithDetails, Sign} from "@/src";
import LumenSignLayer from './signs/LumenSignLayer';
import {LoupeSign} from "@/src/components/signs/LoupeSign";
import InclineSignLayer from "@/src/components/signs/InclineSignLayer";
import {TouchSign} from "@/src/components/signs/TouchSign";
import {FeatureMode} from "@/app/(main-app)/(main-stack)/sign-details";
import {ManualNavigation} from "@/src/components/ManualNavigation";
import Constants from 'expo-constants';
import * as ScreenOrientation from "expo-screen-orientation";
import {OrientationLock} from "expo-screen-orientation";
import {useCustomOrientation} from "@/src/hooks/useCustomOrientation";
import {useSafeAreaInsets} from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get('window');

// ============================================================
// КОНСТАНТЫ
// ============================================================
const ROTATION_DURATION = 2500;        // Длительность анимации переворота банкноты (мс)
const PAN_DURATION = 2000;             // Длительность анимации панорамирования к знаку (мс)
const BANKNOTE_SCALE_FACTOR_VERTICAL = 2;    // Масштаб для вертикальной ориентации банкноты
const BANKNOTE_SCALE_FACTOR_HORIZONTAL = 3.75; // Масштаб для горизонтальной ориентации
const SIGN_POINT_SIZE = 12;             // Размер точки-маркера знака (пиксели)
const SIGN_POINT_COLOR = '#FF3B30';     // Цвет обычной точки знака (красный)
const ACTIVE_SIGN_COLOR = '#FF9500';    // Цвет активной точки знака (оранжевый)
const ZOOM_OUT_SCALE = 0.15;            // Масштаб при отдалении во время переворота
const ZOOM_NORMAL_SCALE = 1;             // Нормальный масштаб
const INFO_BUTTON_SIZE = 56;             // Размер кнопки информации
const FEATURE_BUTTON_SIZE = 56;          // Размер кнопки режима признаков
const ACCELEROMETER_UPDATE_INTERVAL = 50; // Интервал обновления акселерометра (мс)
const COMPASS_UPDATE_INTERVAL = 50; // Интервал обновления компаса (мс)
const FEATURE_SCALE_ANIMATION_DURATION = 1000; // Длительность анимации масштабирования признака (мс)
const DEFAULT_PERSPECTIVE = 1000;

// Константы для Dev режима
const DEV_PARENT_ROTATION_STEP = 15;     // Шаг поворота родительского слоя в Dev режиме (градусы)
const DEV_PARENT_SCALE_STEP = 0.1;       // Шаг масштабирования родительского слоя в Dev режиме

type DevMode = 'off' | 'manual';           // Режим разработчика

// ============================================================
// ТИПЫ ДЛЯ WORKLET-БЕЗОПАСНЫХ ДАННЫХ
// ============================================================
interface AnimationData {
  startX: number;    // Начальная позиция X для анимации
  startY: number;    // Начальная позиция Y для анимации
  centerX: number;   // Центральная позиция X (для переворота)
  centerY: number;   // Центральная позиция Y (для переворота)
  targetX: number;   // Целевая позиция X
  targetY: number;   // Целевая позиция Y
  startRot: number;  // Начальный угол поворота
  endRot: number;    // Конечный угол поворота
}

// ============================================================
// ИНТЕРФЕЙС ПРОПСОВ
// ============================================================
interface SignBanknote3DViewProps {
  typeCode?: string;                    // Код типа знака (lumen, loupe, incline)
  banknoteSigns: Sign[];                // Все знаки банкноты
  currentSign: Sign;                     // Текущий выбранный знак
  currentSide: 'obverse' | 'reverse';    // Текущая отображаемая сторона
  selectedModification: ModificationWithDetails; // Выбранная модификация банкноты
  onSignChange: (sign: Sign) => void;    // Колбэк при смене знака
  onInfoButtonPress?: () => void;         // Колбэк при нажатии на кнопку информации
  enableDevMode?: boolean;                 // Флаг для включения режима разработчика
  onFeatureModeChange?: (mode: FeatureMode) => void;
  featureMode: FeatureMode;
}

export default function SignBanknote3DView({
                                             selectedModification,
                                             banknoteSigns,
                                             currentSign,
                                             onSignChange,
                                             currentSide,
                                             typeCode,
                                             onInfoButtonPress,
                                             onFeatureModeChange,
                                             featureMode,
                                             enableDevMode = __DEV__, // По умолчанию только в DEV режиме
                                           }: SignBanknote3DViewProps) {
  const screenOrientation = useCustomOrientation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // ============================================================
  // СОСТОЯНИЯ
  // ============================================================
  const accelerometerData = useSharedValue({ x: 0, y: 0, z: 0 });
  const accelerometerRawData = useSharedValue({ x: 0, y: 0, z: 0 });
  const accelerometerStartData = useSharedValue({ x: 0, y: 0, z: 0 }); // Начальное значение акселерометра

  const compassData = useSharedValue(0); // Данные компаса
  const compassRawData = useSharedValue(0); // Данные компаса
  const compassStartData = useSharedValue(0); // Начальное значение компаса
  const isCompassEnable = useSharedValue(true); // Флаг доступности компаса

  const isSensorsEnable = useSharedValue(false); // Флаг доступности сенсоров

  // Состояние для Dev режима
  const [devMode, setDevMode] = useState<DevMode>('off');

  // ТОЛЬКО родительские повороты и масштаб для Dev режима
  const [devParentRotX, setDevParentRotX] = useState(0);
  const [devParentRotY, setDevParentRotY] = useState(0);
  const [devParentRotZ, setDevParentRotZ] = useState(0);
  const [devParentScale, setDevParentScale] = useState(1);

  // Shared values для получения углов от дочерних компонентов (InclineSignLayer)
  // БАЗОВЫЕ углы X, Y (сырые из анимации) – для родительского слоя
  const baseRotationXFromChild = useSharedValue(0);
  const baseRotationYFromChild = useSharedValue(0);
  // СДВИНУТЫЙ угол Z (rawRotationZ + startRotZAngle) – для родительского слоя
  const shiftedRotationZFromChild = useSharedValue(0);
  // НОРМАЛИЗОВАННЫЕ углы – для знаков
  const normRotationXFromChild = useSharedValue(0);
  const normRotationYFromChild = useSharedValue(0);
  const normRotationZFromChild = useSharedValue(0);

  const [containerSize, setContainerSize] = useState({
    width: screenWidth,
    height: 0,
  }); // Размер контейнера для банкноты
  const [isLayoutReady, setIsLayoutReady] = useState(false); // Флаг готовности лейаута

  const [pictures, setPictures] = useState<{ obverse?: any; reverse?: any }>({}); // Изображения сторон банкноты
  const [isLoadingPictures, setIsLoadingPictures] = useState(false); // Флаг загрузки изображений

  /**
   * Состояние для управления отображением признаков во время анимации.
   * Во время анимации устанавливается в null, чтобы признаки не отображались.
   * После завершения анимации устанавливается в текущий знак.
   */
  const [activeSignForFeatures, setActiveSignForFeatures] = useState<Sign | null>(null);

  // ========== СОСТОЯНИЯ ДЛЯ УПРАВЛЕНИЯ ВОСПРОИЗВЕДЕНИЕМ АНИМАЦИИ ==========
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(true); // Флаг воспроизведения анимации признаков
  const [shouldForcePlayOnSignChange, setShouldForcePlayOnSignChange] = useState(false); // Флаг принудительного запуска при смене знака

  // ============================================================
  // REANIMATED SHARED VALUES (основные анимационные значения)
  // ============================================================
  const rotation = useSharedValue(0);      // Поворот вокруг оси Y (переворот банкноты)
  const rotationZ = useSharedValue(0);     // Поворот вокруг оси Z (вращение банкноты) – пока не используется
  const panX = useSharedValue(0);           // Смещение по X (панорамирование)
  const panY = useSharedValue(0);           // Смещение по Y (панорамирование)
  const scale = useSharedValue(ZOOM_NORMAL_SCALE); // Масштаб

  // Shared values для родительских поворотов и масштаба (используются в Dev режиме)
  const parentRotationX = useSharedValue(0);
  const parentRotationY = useSharedValue(0);
  const parentRotationZ = useSharedValue(0);
  const parentScale = useSharedValue(1);

  // Shared value для дополнительного масштабирования от sign_scale_value
  // Применяется на родительском слое и работает всегда, независимо от анимаций
  const featureScale = useSharedValue(1);

  // Shared values для хранения начального и конечного масштаба при анимации
  const startFeatureScale = useSharedValue(1);
  const endFeatureScale = useSharedValue(1);

  // Состояния для отслеживания процессов анимации
  const [isRotating, setIsRotating] = useState(false);       // Идёт ли переворот
  const [isPanAnimating, setIsPanAnimating] = useState(false); // Идёт ли панорамирование
  const [displaySide, setDisplaySide] = useState<'obverse' | 'reverse'>(() => {
    return currentSide;
  }); // Отображаемая сторона

  const [showSignPoints, setShowSignPoints] = useState(true);     // Показывать ли точки знаков
  const [showFeaturesLayer, setShowFeaturesLayer] = useState(true); // Показывать ли слой признаков

  // Shared values для анимации поворота (используются в worklet-функциях)
  const startPanX = useSharedValue(0);
  const startPanY = useSharedValue(0);
  const centerPanX = useSharedValue(0);
  const centerPanY = useSharedValue(0);
  const targetPanX = useSharedValue(0);
  const targetPanY = useSharedValue(0);
  const startRotation = useSharedValue(0);
  const endRotation = useSharedValue(0);
  const isFlipActive = useSharedValue(false); // Активен ли переворот (для worklet)

  // Refs для хранения значений между рендерами (чтобы не вызывать лишних ререндеров)
  const displaySideRef = useRef(displaySide);
  const isInitializedRef = useRef(false);         // Была ли произведена инициализация
  const lastSignIdRef = useRef<number | undefined>(currentSign?.sign_id); // ID последнего отображаемого знака
  const isAnimatingRef = useRef(false);            // Флаг анимации (для блокировок)
  const animationDataRef = useRef<AnimationData | null>(null); // Данные текущей анимации
  const targetSignRef = useRef<Sign | null>(null); // Целевой знак при перевороте
  const targetSideRef = useRef<'obverse' | 'reverse'>('obverse'); // Целевая сторона

  // ============================================================
  // СИНХРОНИЗАЦИЯ REF С STATE
  // ============================================================
  useEffect(() => {
    displaySideRef.current = displaySide;
  }, [displaySide]);

  // Синхронизация shared values с dev состояниями
  useEffect(() => {
    if (devMode === 'manual') {
      // Синхронизируем только родительские повороты и масштаб
      parentRotationX.value = devParentRotX;
      parentRotationY.value = devParentRotY;
      parentRotationZ.value = devParentRotZ;
      parentScale.value = devParentScale;
    }
  }, [devMode, devParentRotX, devParentRotY, devParentRotZ, devParentScale]);

  /**
   * Синхронизация activeSignForFeatures с currentSign.
   * Если анимация не активна и есть текущий знак, устанавливаем его для отображения признаков.
   */
  useEffect(() => {
    if (!isRotating && !isPanAnimating && currentSign) {
      setActiveSignForFeatures(currentSign);
    }
  }, [isRotating, isPanAnimating, currentSign]);

  /**
   * Эффект для плавного изменения масштаба на основе sign_scale_value.
   * Применяется на родительском слое для дополнительного масштабирования признака.
   * Масштаб плавно анимируется с длительностью FEATURE_SCALE_ANIMATION_DURATION.
   * Работает всегда, независимо от анимаций переворота/панорамирования.
   */
  useEffect(() => {
    if (!activeSignForFeatures) {
      // Если нет активного знака - сбрасываем масштаб к 1
      startFeatureScale.value = featureScale.value;
      endFeatureScale.value = 1;
      featureScale.value = withTiming(1, {
        duration: FEATURE_SCALE_ANIMATION_DURATION,
        easing: ReanimatedEasing.inOut(ReanimatedEasing.cubic)
      });
      return;
    }

    // sign_scale_value - это абсолютный масштаб
    // Если значение 1 = оригинальный размер, 2 = увеличение в 2 раза
    const targetScale = (activeSignForFeatures?.sign_scale_value && activeSignForFeatures?.sign_scale_value > 0)
      ? activeSignForFeatures.sign_scale_value
      : 1;

    // Сохраняем начальный и конечный масштаб для анимации перехода
    startFeatureScale.value = featureScale.value;
    endFeatureScale.value = targetScale;

    // Плавно анимируем масштаб к целевому значению
    featureScale.value = withTiming(targetScale, {
      duration: FEATURE_SCALE_ANIMATION_DURATION,
      easing: ReanimatedEasing.inOut(ReanimatedEasing.cubic)
    });
  }, [activeSignForFeatures]);

  /**
   * Получение нормализованных координат знака (0-1)
   * Преобразует координаты из базы данных в систему координат экрана
   */
  const getSignPosition = (sign: Sign) => {
    let x = sign.show_x || 0;
    let y = sign.show_y || 0;

    // Меняем местами и инвертируем для соответствия системе координат
    return { x: y, y: 1 - x };
  };

  // ============================================================
  // ЗАГРУЗКА ИЗОБРАЖЕНИЙ банкноты
  // ============================================================
  useEffect(() => {
    if (selectedModification) {
      loadPictures();
    }
  }, [selectedModification]);

  const loadPictures = async () => {
    setIsLoadingPictures(true);
    try {
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

  // ============================================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ для расчёта размеров банкноты
  // ============================================================
  const getBanknoteSize = () => {
    const defaultSize = { width: 150, height: 65, aspectRatio: 150 / 65 };
    if (!selectedModification) return defaultSize;
    const width = selectedModification.bnk_size_width || 150;
    const height = selectedModification.bnk_size_height || 65;
    return { width, height, aspectRatio: height / width };
  };

  const getBanknoteOrientation = useCallback(() => {
    const { aspectRatio } = getBanknoteSize();
    return aspectRatio > 1 ? 'vertical' : 'horizontal';
  }, [selectedModification]);

  const getBanknoteScaleFactor = useCallback(() => {
    const banknoteOrientation = getBanknoteOrientation();
    let factor = banknoteOrientation === 'vertical'
      ? BANKNOTE_SCALE_FACTOR_VERTICAL
      : BANKNOTE_SCALE_FACTOR_HORIZONTAL;
    if (screenOrientation === 'LANDSCAPE')
      factor = factor * (screenHeight / screenWidth);

    console.log('factor', factor);
    return factor;
  }, [getBanknoteOrientation, screenOrientation, screenHeight, screenWidth]);

  const calculateContainerSize = () => {
    const { aspectRatio } = getBanknoteSize();
    const rotatedAspectRatio = 1 / aspectRatio; // Соотношение сторон после поворота

    const maxWidth = containerSize.width;
    const maxHeight = containerSize.height;

    let width = maxWidth;
    let height = width / rotatedAspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * rotatedAspectRatio;
    }

    return { width, height };
  };

  const [containerSizeCalculated, setContainerSizeCalculated] = useState({ width: 0, height: 0 })

  useEffect(()=>{
    setContainerSizeCalculated(calculateContainerSize());
  }, [isLayoutReady, containerSize])


    // isLayoutReady ? calculateContainerSize() : { width: 0, height: 0 };
  const banknoteScaleFactor = getBanknoteScaleFactor();

  // ============================================================
  // ФИЛЬТРАЦИЯ ЗНАКОВ по типу и стороне
  // ============================================================
  const { obverseSigns, reverseSigns } = useMemo(() => {
    const filteredByType = typeCode
      ? banknoteSigns.filter(sign =>
        sign.sign_type?.sign_type_code?.toLowerCase() === typeCode.toLowerCase()
      )
      : banknoteSigns;

    const orientation = getBanknoteOrientation();

    // ОТФИЛЬТРОВАННЫЕ знаки для навигации (скрытые знаки НЕ отображаются)
    const obverse = filteredByType
      .filter(sign => sign.sign_side === 1 && (!sign.is_hide || sign.is_hide === 0))
      .sort((a, b) => {
        const coordsA = getSignPosition(a);
        const coordsB = getSignPosition(b);

        if (orientation === 'horizontal') {
          return coordsB.x - coordsA.x;
        } else {
          return coordsA.y - coordsB.y;
        }
      });

    const reverse = filteredByType
      .filter(sign => sign.sign_side === 2 && (!sign.is_hide || sign.is_hide === 0))
      .sort((a, b) => {
        const coordsA = getSignPosition(a);
        const coordsB = getSignPosition(b);

        if (orientation === 'horizontal') {
          return coordsB.x - coordsA.x;
        } else {
          return coordsB.y - coordsA.y;
        }
      });

    return { obverseSigns: obverse, reverseSigns: reverse };
  }, [banknoteSigns, typeCode, selectedModification]);

  // ============================================================
  // ПОЛНЫЙ СПИСОК ЗНАКОВ ДЛЯ СЛОЯ ПРИЗНАКОВ (включая скрытые)
  // ============================================================
  const allSignsOnCurrentSide = useMemo(() => {
    const filteredByType = typeCode
      ? banknoteSigns.filter(sign =>
        sign.sign_type?.sign_type_code?.toLowerCase() === typeCode.toLowerCase()
      )
      : banknoteSigns;

    // ПОЛНЫЙ список знаков на текущей стороне (включая скрытые)
    return displaySide === 'obverse'
      ? filteredByType.filter(sign => sign.sign_side === 1)
      : filteredByType.filter(sign => sign.sign_side === 2);
  }, [banknoteSigns, typeCode, displaySide]);

  // ============================================================
  // WORKLET-ФУНКЦИИ АНИМАЦИЙ (выполняются в UI-потоке)
  // ============================================================

  /**
   * Worklet для анимации панорамирования к знаку
   */
  const animatePanWorklet = useCallback((
    targetX: number,
    targetY: number,
    duration: number,
    onComplete: () => void
  ) => {
    'worklet';

    isFlipActive.value = false; // Сбрасываем флаг переворота

    console.log('animatePanWorklet', targetX, targetY);

    // Анимируем panX с колбэком завершения
    panX.value = withTiming(
      targetX,
      {
        duration,
        easing: ReanimatedEasing.inOut(ReanimatedEasing.cubic)
      },
      (finished) => {
        if (finished) {
          runOnJS(onComplete)(); // Вызываем JS-колбэк по завершении
        }
      }
    );

    // Анимируем panY и scale без колбэков (синхронно с panX)
    panY.value = withTiming(
      targetY,
      {
        duration,
        easing: ReanimatedEasing.inOut(ReanimatedEasing.cubic)
      }
    );

    scale.value = withTiming(ZOOM_NORMAL_SCALE, {
      duration,
      easing: ReanimatedEasing.inOut(ReanimatedEasing.cubic)
    });
  }, []);

  /**
   * Worklet для анимации переворота банкноты
   * Поддерживает плавное изменение масштаба признака во время переворота
   */
  const animateFlipWorklet = useCallback((
    startRot: number,
    endRot: number,
    startX: number,
    startY: number,
    centerX: number,
    centerY: number,
    targetX: number,
    targetY: number,
    startFeatureScaleValue: number,
    endFeatureScaleValue: number,
    duration: number,
    onComplete: () => void
  ) => {
    'worklet';

    // Сохраняем все параметры в shared values для использования в cameraPosition
    startPanX.value = startX;
    startPanY.value = startY;
    centerPanX.value = centerX;
    centerPanY.value = centerY;
    targetPanX.value = targetX;
    targetPanY.value = targetY;
    startRotation.value = startRot;
    endRotation.value = endRot;

    isFlipActive.value = true; // Включаем флаг переворота

    // Анимируем поворот
    rotation.value = withTiming(
      endRot,
      { duration, easing: ReanimatedEasing.inOut(ReanimatedEasing.ease) },
      (finished) => {
        isFlipActive.value = false;

        if (finished) {
          // По завершении устанавливаем финальные позиции
          panX.value = targetX;
          panY.value = targetY;
          scale.value = ZOOM_NORMAL_SCALE;
          // Убеждаемся, что масштаб установлен в финальное значение
          featureScale.value = endFeatureScaleValue;
        }

        // Вызываем колбэк завершения
        runOnJS(onComplete)();
      }
    );

    // Анимируем масштаб признака синхронно с поворотом
    featureScale.value = withTiming(
      endFeatureScaleValue,
      {
        duration,
        easing: ReanimatedEasing.inOut(ReanimatedEasing.cubic)
      }
    );
  }, []);

  // ============================================================
  // JS-ФУНКЦИИ для работы с координатами знаков
  // ============================================================
  /**
   * Получение позиции точки знака в пикселях
   */
  const getSignPointPosition = (sign: Sign, banknoteWidth: number, banknoteHeight: number) => {
    const pos = getSignPosition(sign);
    return {
      left: pos.x * banknoteWidth - SIGN_POINT_SIZE / 2,
      top: pos.y * banknoteHeight - SIGN_POINT_SIZE / 2,
    };
  };

  /**
   * Получение позиции панорамирования для центрирования знака
   * Возвращает смещение, которое нужно применить к банкноте, чтобы знак оказался в центре
   */
  const getPanPositionForSign = useCallback((sign: Sign) => {
    if (!containerSizeCalculated.width || !containerSizeCalculated.height) {
      return { x: 0, y: 0 };
    }

    const pos = getSignPosition(sign);

    const banknoteWidth = containerSizeCalculated.width * banknoteScaleFactor;
    const banknoteHeight = containerSizeCalculated.height * banknoteScaleFactor;

    const signPixelX = pos.x * banknoteWidth;
    const signPixelY = pos.y * banknoteHeight;

    const centerX = banknoteWidth / 2;
    const centerY = banknoteHeight / 2;

    // Смещение = центр банкноты минус позиция знака
    return {
      x: centerX - signPixelX,
      y: centerY - signPixelY,
    };
  }, [containerSizeCalculated, banknoteScaleFactor, screenOrientation, screenHeight, screenWidth]);

  /**
   * Получение центральной позиции банкноты (без смещения)
   */
  const getBanknoteCenterPosition = useCallback(() => {
    return { x: 0, y: 0 };
  }, []);

  /**
   * Получение средней точки между двумя знаками
   * Используется для анимации переворота, чтобы банкнота вращалась вокруг средней точки
   */
  const getMidpointBetweenSigns = useCallback((startSign: Sign, targetSign: Sign) => {
    if (!containerSizeCalculated.width || !containerSizeCalculated.height) {
      return { x: 0, y: 0 };
    }

    const startPos = getSignPosition(startSign);
    const targetPos = getSignPosition(targetSign);

    const banknoteWidth = containerSizeCalculated.width * banknoteScaleFactor;
    const banknoteHeight = containerSizeCalculated.height * banknoteScaleFactor;

    const startPixelX = startPos.x * banknoteWidth;
    const startPixelY = startPos.y * banknoteHeight;
    const targetPixelX = targetPos.x * banknoteWidth;
    const targetPixelY = targetPos.y * banknoteHeight;

    const midpointPixelX = (startPixelX + targetPixelX) / 2;
    const midpointPixelY = (startPixelY + targetPixelY) / 2;

    const centerX = banknoteWidth / 2;
    const centerY = banknoteHeight / 2;

    return {
      x: centerX - midpointPixelX,
      y: centerY - midpointPixelY,
    };
  }, [containerSizeCalculated, banknoteScaleFactor, screenOrientation, screenHeight, screenWidth]);

  /**
   * Получение оптимальной центральной позиции для анимации переворота
   * Если знаки находятся в разных половинах банкноты, используем среднюю точку,
   * иначе - центр банкноты
   */
  const getOptimalCenterPosition = useCallback((startSign: Sign, targetSign: Sign) => {
    if (!containerSizeCalculated.width || !containerSizeCalculated.height) {
      return { x: 0, y: 0 };
    }

    const startPos = getSignPosition(startSign);
    const targetPos = getSignPosition(targetSign);

    const banknoteWidth = containerSizeCalculated.width * banknoteScaleFactor;
    const banknoteHeight = containerSizeCalculated.height * banknoteScaleFactor;

    const startPixelX = startPos.x * banknoteWidth;
    const startPixelY = startPos.y * banknoteHeight;
    const targetPixelX = targetPos.x * banknoteWidth;
    const targetPixelY = targetPos.y * banknoteHeight;

    const orientation = getBanknoteOrientation();

    if (orientation === 'horizontal') {
      // Для горизонтальной банкноты анализируем по X
      const banknoteCenterX = banknoteWidth / 2;
      const startIsLeftHalf = startPixelX < banknoteCenterX;
      const targetIsLeftHalf = targetPixelX < banknoteCenterX;
      const sameHalf = (startIsLeftHalf && targetIsLeftHalf) || (!startIsLeftHalf && !targetIsLeftHalf);
      const crossesCenter = (startPixelX < banknoteCenterX && targetPixelX > banknoteCenterX) ||
        (startPixelX > banknoteCenterX && targetPixelX < banknoteCenterX);

      if (crossesCenter || !sameHalf) {
        return getMidpointBetweenSigns(startSign, targetSign);
      } else {
        return getBanknoteCenterPosition();
      }
    } else {
      // Для вертикальной банкноты анализируем по Y
      const banknoteCenterY = banknoteHeight / 2;
      const startIsTopHalf = startPixelY < banknoteCenterY;
      const targetIsTopHalf = targetPixelY < banknoteCenterY;
      const sameHalf = (startIsTopHalf && targetIsTopHalf) || (!startIsTopHalf && !targetIsTopHalf);
      const crossesCenter = (startPixelY < banknoteCenterY && targetPixelY > banknoteCenterY) ||
        (startPixelY > banknoteCenterY && targetPixelY < banknoteCenterY);

      if (crossesCenter || !sameHalf) {
        return getMidpointBetweenSigns(startSign, targetSign);
      } else {
        return getBanknoteCenterPosition();
      }
    }
  }, [containerSizeCalculated, banknoteScaleFactor, getMidpointBetweenSigns, getBanknoteCenterPosition, getBanknoteOrientation,
      screenOrientation, screenHeight, screenWidth]);

  /**
   * Получение целевого знака для переворота на другую сторону
   * При переходе на другую сторону выбираем первый или последний знак на целевой стороне
   */
  const getTargetSignForFlip = useCallback((direction: 'next' | 'prev', currentSide: 'obverse' | 'reverse') => {
    const targetSide = currentSide === 'obverse' ? 'reverse' : 'obverse';
    const targetSideSigns = targetSide === 'obverse' ? obverseSigns : reverseSigns;

    if (targetSideSigns.length === 0) return null;

    if (direction === 'next') {
      return targetSideSigns[0];
    } else {
      return targetSideSigns[targetSideSigns.length - 1];
    }
  }, [obverseSigns, reverseSigns]);

  // ============================================================
  // ПРОИЗВОДНОЕ ЗНАЧЕНИЕ ДЛЯ ПОЗИЦИИ КАМЕРЫ
  // ============================================================
  const cameraPosition = useDerivedValue(() => {
    if (!isFlipActive.value) {
      // Если переворот не активен, возвращаем текущие значения
      return {
        panX: panX.value,
        panY: panY.value,
        scale: scale.value,
      };
    }

    // Если переворот активен, интерполируем позицию между начальной, центральной и целевой
    const totalDelta = endRotation.value - startRotation.value;
    if (totalDelta === 0) {
      return {
        panX: panX.value,
        panY: panY.value,
        scale: scale.value,
      };
    }

    let progress = (rotation.value - startRotation.value) / totalDelta;
    progress = Math.max(0, Math.min(1, progress));

    let currentPanX: number, currentPanY: number, currentScale: number;

    if (progress < 0.5) {
      // Первая половина: движение к центру с уменьшением масштаба
      const phaseProgress = progress * 2;
      currentPanX = startPanX.value + (centerPanX.value - startPanX.value) * phaseProgress;
      currentPanY = startPanY.value + (centerPanY.value - startPanY.value) * phaseProgress;
      currentScale = ZOOM_NORMAL_SCALE + (ZOOM_OUT_SCALE - ZOOM_NORMAL_SCALE) * phaseProgress;
    } else {
      // Вторая половина: движение от центра к цели с увеличением масштаба
      const phaseProgress = (progress - 0.5) * 2;
      currentPanX = centerPanX.value + (targetPanX.value - centerPanX.value) * phaseProgress;
      currentPanY = centerPanY.value + (targetPanY.value - centerPanY.value) * phaseProgress;
      currentScale = ZOOM_OUT_SCALE + (ZOOM_NORMAL_SCALE - ZOOM_OUT_SCALE) * phaseProgress;
    }

    return {
      panX: currentPanX,
      panY: currentPanY,
      scale: currentScale,
    };
  });

  // ============================================================
  // АНИМИРОВАННЫЕ СТИЛИ
  // ============================================================
  // Стиль для внутреннего слоя банкноты – здесь применяем панорамирование, масштаб и повороты, связанные с навигацией (переворот, вращение Z)
  const banknoteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cameraPosition.value.panX },
      { translateY: cameraPosition.value.panY },
      { scale: cameraPosition.value.scale },
      { rotateZ: `${rotationZ.value}deg` },
    ],
  }));

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${rotation.value}deg` }, // только rotateY
    ],
    backfaceVisibility: 'hidden',
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${rotation.value + 180}deg` }, // только rotateY
    ],
    backfaceVisibility: 'hidden',
  }));

  // Анимированный стиль для родительского слоя – содержит базовые углы от дочерних компонентов и Dev-повороты
  const parentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {perspective: DEFAULT_PERSPECTIVE},
      // Базовые углы от дочерних компонентов (InclineSignLayer) + Dev-повороты
      { rotateX: `${parentRotationX.value + baseRotationXFromChild.value}deg` },
      { rotateY: `${-(parentRotationY.value + baseRotationYFromChild.value)}deg` }, // отрицание Y
      { rotateZ: `${-(parentRotationZ.value + shiftedRotationZFromChild.value)}deg` }, // отрицание сдвинутого Z
      // Комбинируем Dev-масштаб и масштаб признака (sign_scale_value)
      { scale: parentScale.value * featureScale.value },
    ],
  }));

  // ============================================================
  // ИНИЦИАЛИЗАЦИЯ (первоначальная установка позиции)
  // ============================================================
  useEffect(() => {
    if (isLayoutReady && !isLoadingPictures && currentSign && !isInitializedRef.current && devMode === 'off') {
      const targetSide = currentSign.sign_side === 1 ? 'obverse' : 'reverse';
      const targetRotation = targetSide === 'obverse' ? 0 : 180;

      rotation.value = targetRotation;
      rotationZ.value = 0;
      setDisplaySide(targetSide);

      const targetPos = getPanPositionForSign(currentSign);
      panX.value = targetPos.x;
      panY.value = targetPos.y;

      // Устанавливаем начальный масштаб для первого знака
      const initialFeatureScale = (currentSign?.sign_scale_value && currentSign?.sign_scale_value > 0)
        ? currentSign.sign_scale_value
        : 1;
      featureScale.value = initialFeatureScale;
      startFeatureScale.value = initialFeatureScale;
      endFeatureScale.value = initialFeatureScale;

      // Синхронизируем родительские повороты и масштаб
      setDevParentRotX(0);
      setDevParentRotY(0);
      setDevParentRotZ(0);
      setDevParentScale(1);

      scale.value = ZOOM_NORMAL_SCALE;

      isInitializedRef.current = true;
      lastSignIdRef.current = currentSign.sign_id;
    }
  }, [isLayoutReady, isLoadingPictures, currentSign, getPanPositionForSign, devMode]);

  // ============================================================
  // ОСНОВНЫЕ ФУНКЦИИ (навигация, анимации)
  // ============================================================
  /**
   * Обработчик переворота банкноты на другую сторону
   */
  const handleFlip = useCallback((direction: 'next' | 'prev', explicitTargetSign?: Sign) => {
    if (isAnimatingRef.current || isRotating || devMode !== 'off') {
      return;
    }

    // Скрываем признаки во время анимации
    setActiveSignForFeatures(null);

    const currentSide = displaySideRef.current;
    const targetSide = currentSide === 'obverse' ? 'reverse' : 'obverse';

    let targetSign: Sign | null = explicitTargetSign || null;
    if (!targetSign) {
      targetSign = getTargetSignForFlip(direction, currentSide);
    }

    if (!targetSign) {
      return;
    }

    targetSignRef.current = targetSign;
    targetSideRef.current = targetSide;

    // Определяем начальный знак (текущий или последний известный)
    let startSign: Sign | null = null;

    if (lastSignIdRef.current) {
      startSign = banknoteSigns.find(s => s.sign_id === lastSignIdRef.current) || null;
    }

    if (!startSign) {
      startSign = currentSign;
    }

    // Вычисляем начальный и конечный масштаб признака
    const startFeatureScaleValue = (startSign?.sign_scale_value && startSign?.sign_scale_value > 0)
      ? startSign.sign_scale_value
      : 1;
    const endFeatureScaleValue = (targetSign?.sign_scale_value && targetSign?.sign_scale_value > 0)
      ? targetSign.sign_scale_value
      : 1;

    const currentPanPos = { x: panX.value, y: panY.value };
    const targetPos = getPanPositionForSign(targetSign);
    const centerPos = getOptimalCenterPosition(startSign, targetSign);

    const startRot = rotation.value;
    const endRot = direction === 'next'
      ? startRot + 180
      : startRot - 180;

    animationDataRef.current = {
      startX: currentPanPos.x,
      startY: currentPanPos.y,
      centerX: centerPos.x,
      centerY: centerPos.y,
      targetX: targetPos.x,
      targetY: targetPos.y,
      startRot,
      endRot,
    };

    isAnimatingRef.current = true;
    setIsRotating(true);
    setShowSignPoints(false);
    setShowFeaturesLayer(false);

    animateFlipWorklet(
      startRot,
      endRot,
      currentPanPos.x,
      currentPanPos.y,
      centerPos.x,
      centerPos.y,
      targetPos.x,
      targetPos.y,
      startFeatureScaleValue,
      endFeatureScaleValue,
      ROTATION_DURATION,
      () => {
        if (targetSignRef.current && targetSideRef.current) {
          setDisplaySide(targetSideRef.current);
          onSignChange(targetSignRef.current);
          lastSignIdRef.current = targetSignRef.current.sign_id;

          // Показываем признаки для нового знака
          setActiveSignForFeatures(targetSignRef.current);
        }

        setIsRotating(false);
        setShowSignPoints(true);
        setShowFeaturesLayer(true);
        isAnimatingRef.current = false;
        animationDataRef.current = null;
        targetSignRef.current = null;
      }
    );
  }, [isRotating, rotation, obverseSigns, reverseSigns, onSignChange, getPanPositionForSign, getOptimalCenterPosition, getTargetSignForFlip, banknoteSigns, currentSign, animateFlipWorklet, devMode]);


  useEffect(() => {
    // if (isAnimatingRef.current || isPanAnimating || isRotating || !currentSign || !isLayoutReady || !isInitializedRef.current || devMode !== 'off') {
    //   return;
    // }

    const targetPos = getPanPositionForSign(currentSign);
    // вычисляем целевой масштаб как абсолютное значение
    const targetScale = (currentSign?.sign_scale_value && currentSign?.sign_scale_value > 0)
      ? currentSign.sign_scale_value
      : 1;

    cancelAnimation(panX);
    cancelAnimation(panY);
    cancelAnimation(featureScale);

    console.log('update targetPos:', targetPos, targetScale)
    panX.value = targetPos.x;
    panY.value = targetPos.y;
    featureScale.value = targetScale;

  }, [containerSizeCalculated, banknoteScaleFactor,
     screenOrientation, screenHeight, screenWidth]);



  /**
   * Анимация к указанному знаку (панорамирование)
   */
  const animateToSign = useCallback((sign: Sign) => {
    if (isAnimatingRef.current || isPanAnimating || isRotating || !sign || !isLayoutReady || !isInitializedRef.current || devMode !== 'off') {
      return;
    }

    // Скрываем признаки во время анимации
    setActiveSignForFeatures(null);

    const targetPos = getPanPositionForSign(sign);

    // вычисляем целевой масштаб как абсолютное значение
    const targetScale = (sign?.sign_scale_value && sign?.sign_scale_value > 0)
      ? sign.sign_scale_value
      : 1;

    cancelAnimation(panX);
    cancelAnimation(panY);
    cancelAnimation(scale);
    cancelAnimation(featureScale);

    isAnimatingRef.current = true;
    setIsPanAnimating(true);
    isFlipActive.value = false;

    requestAnimationFrame(() => {
      animatePanWorklet(
        targetPos.x,
        targetPos.y,
        PAN_DURATION,
        () => {
          // Показываем признаки для нового знака после завершения анимации
          setActiveSignForFeatures(sign);
          setIsPanAnimating(false);
          isAnimatingRef.current = false;
        }
      );
    });

    // Анимируем масштаб признака синхронно с панорамированием
    featureScale.value = withTiming(targetScale, {
      duration: PAN_DURATION,
      easing: ReanimatedEasing.inOut(ReanimatedEasing.cubic)
    });
  }, [isPanAnimating, isRotating, containerSizeCalculated, banknoteScaleFactor, getPanPositionForSign, animatePanWorklet, isLayoutReady, devMode,
    , screenOrientation, screenHeight, screenWidth]);

  /**
   * Навигация к следующему/предыдущему знаку
   */
  const navigateToSign = useCallback((direction: 'next' | 'prev') => {
    if (isRotating || isPanAnimating || isLoadingPictures || !isLayoutReady || !isInitializedRef.current || !currentSign || devMode !== 'off') {
      return;
    }

    const currentSideSigns = displaySide === 'obverse' ? obverseSigns : reverseSigns;
    if (currentSideSigns.length === 0) return;

    const currentIndex = currentSideSigns.findIndex(s => s.sign_id === currentSign.sign_id);
    if (currentIndex === -1) return;

    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex < 0)
      newIndex += currentSideSigns.length;

    if (newIndex >= currentSideSigns.length)
      newIndex -= currentSideSigns.length;

    if (newIndex >= 0 && newIndex < currentSideSigns.length) {
      // Есть знак на текущей стороне
      const nextSign = currentSideSigns[newIndex];
      onSignChange(nextSign);
    } else {
      // Переход на другую сторону
      handleFlip(direction);
    }
  }, [isRotating, isPanAnimating, isLoadingPictures, isLayoutReady, displaySide, currentSign, obverseSigns, reverseSigns, onSignChange, handleFlip, devMode]);

  /**
   * Обработчик выбора знака для ручного режима
   * Не блокирует отображение меню во время анимации
   */
  const handleManualSignSelect = useCallback(
    (sign: Sign) => {
      // Не блокируем полностью, просто не вызываем навигацию если идет анимация
      if (isRotating || isPanAnimating) return;

      if (sign.sign_side === (displaySide === 'obverse' ? 1 : 2)) {
        // Знак на текущей стороне - панорамируем
        onSignChange(sign);
        animateToSign(sign);
      } else {
        // Знак на другой стороне - выполняем переворот
        const direction = sign.sign_side === 2 ? 'next' : 'prev';
        handleFlip(direction, sign);
      }
    },
    [displaySide, isRotating, isPanAnimating, onSignChange, animateToSign, handleFlip]
  );

  // ============================================================
  // ФУНКЦИИ ДЛЯ DEV РЕЖИМА
  // ============================================================
  const toggleDevMode = useCallback(() => {
    setDevMode(prev => prev === 'off' ? 'manual' : 'off');
  }, []);

  // Повороты родительского слоя
  const rotateParentX = useCallback((delta: number) => {
    setDevParentRotX(prev => {
      const newValue = (prev + delta + 360) % 360;
      parentRotationX.value = newValue;
      return newValue;
    });
  }, []);

  const rotateParentY = useCallback((delta: number) => {
    setDevParentRotY(prev => {
      const newValue = (prev + delta + 360) % 360;
      parentRotationY.value = newValue;
      return newValue;
    });
  }, []);

  const rotateParentZ = useCallback((delta: number) => {
    setDevParentRotZ(prev => {
      const newValue = (prev + delta + 360) % 360;
      parentRotationZ.value = newValue;
      return newValue;
    });
  }, []);

  // Масштабирование родительского слоя
  const scaleParent = useCallback((delta: number) => {
    setDevParentScale(prev => {
      const newValue = Math.max(0.1, Math.min(3, prev + delta));
      parentScale.value = newValue;
      return newValue;
    });
  }, []);

  // Сброс всех родительских поворотов и масштаба
  const resetParent = useCallback(() => {
    setDevParentRotX(0);
    setDevParentRotY(0);
    setDevParentRotZ(0);
    setDevParentScale(1);

    parentRotationX.value = 0;
    parentRotationY.value = 0;
    parentRotationZ.value = 0;
    parentScale.value = 1;

    // Сбрасываем также масштаб признака
    featureScale.value = 1;
    startFeatureScale.value = 1;
    endFeatureScale.value = 1;

    // Сбрасываем также повороты от дочерних компонентов
    baseRotationXFromChild.value = 0;
    baseRotationYFromChild.value = 0;
    shiftedRotationZFromChild.value = 0;
    normRotationXFromChild.value = 0;
    normRotationYFromChild.value = 0;
    normRotationZFromChild.value = 0;
  }, []);

  // ============================================================
  // ОБРАБОТЧИК ЗАВЕРШЕНИЯ АНИМАЦИИ (вызывается из InclineSignLayer)
  // ============================================================
  const handleAnimationComplete = useCallback(() => {
    setIsAnimationPlaying(false);
    // // Если это был принудительный запуск при смене знака,
    // // выключаем воспроизведение после первого цикла
    // if (shouldForcePlayOnSignChange) {
    //   setIsAnimationPlaying(false);
    // }
  }, [shouldForcePlayOnSignChange]);

  // ============================================================
  // РЕАКЦИЯ НА ИЗМЕНЕНИЕ ТЕКУЩЕГО ЗНАКА
  // ============================================================
  useEffect(() => {
    if (!currentSign || isRotating || isPanAnimating || !isLayoutReady || !isInitializedRef.current || devMode !== 'off') return;

    if (lastSignIdRef.current === currentSign.sign_id) return;

    const signSide = currentSign.sign_side === 1 ? 'obverse' : 'reverse';

    // При смене знака:
    // 1. Включаем принудительный запуск
    // 2. Включаем воспроизведение анимации
    setShouldForcePlayOnSignChange(true);
    setIsAnimationPlaying(true);

    if (signSide !== displaySide) {
      // Знак на другой стороне - делаем переворот
      const direction = signSide === 'reverse' ? 'next' : 'prev';
      handleFlip(direction, currentSign);
    } else {
      // Знак на той же стороне - панорамируем
      animateToSign(currentSign);
    }

    lastSignIdRef.current = currentSign.sign_id;
  }, [currentSign?.sign_id, displaySide, isLayoutReady, isRotating, isPanAnimating, handleFlip, animateToSign, devMode]);

  // Сбрасываем флаг принудительного запуска после завершения анимации перехода
  useEffect(() => {
    if (!isRotating && !isPanAnimating && shouldForcePlayOnSignChange) {
      // Даём время на то, чтобы анимация признаков успела завершиться
      setTimeout(() => {
        setShouldForcePlayOnSignChange(false);
      }, 100);
    }
  }, [isRotating, isPanAnimating, shouldForcePlayOnSignChange]);

  // ============================================================
  // CLEANUP (отмена анимаций при размонтировании)
  // ============================================================
  useEffect(() => {
    return () => {
      cancelAnimation(rotation);
      cancelAnimation(rotationZ);
      cancelAnimation(panX);
      cancelAnimation(panY);
      cancelAnimation(scale);
      cancelAnimation(parentRotationX);
      cancelAnimation(parentRotationY);
      cancelAnimation(parentRotationZ);
      cancelAnimation(parentScale);
      cancelAnimation(featureScale);
      cancelAnimation(startFeatureScale);
      cancelAnimation(endFeatureScale);
      cancelAnimation(baseRotationXFromChild);
      cancelAnimation(baseRotationYFromChild);
      cancelAnimation(shiftedRotationZFromChild);
      cancelAnimation(normRotationXFromChild);
      cancelAnimation(normRotationYFromChild);
      cancelAnimation(normRotationZFromChild);
      isFlipActive.value = false;

      // Сбрасываем активный знак при размонтировании
      setActiveSignForFeatures(null);
    };
  }, []);

  const AnimatedText = Animated.createAnimatedComponent(TextInput);

  // ============================================================
  // Датчики (для manual режима)
  // ============================================================

  const accelerometerXText = useAnimatedProps(() => {
    return {
      // Важно: в нативном Text свойство называется 'text' (через пропсы)
      text: `accelerometerX: ${accelerometerData.value.x.toFixed(2)}`
    } as any;
  });

  const accelerometerYText = useAnimatedProps(() => {
    return {
      // Важно: в нативном Text свойство называется 'text' (через пропсы)
      text: `accelerometerY: ${accelerometerData.value.y.toFixed(2)}`
    } as any;
  });

  const accelerometerZText = useAnimatedProps(() => {
    return {
      // Важно: в нативном Text свойство называется 'text' (через пропсы)
      text: `accelerometerZ: ${accelerometerData.value.z.toFixed(2)}`
    } as any;
  });

  const accelerometerRawXText = useAnimatedProps(() => {
    return {
      // Важно: в нативном Text свойство называется 'text' (через пропсы)
      text: `accelerometerRawX: ${accelerometerRawData.value.x.toFixed(2)}`
    } as any;
  });

  const accelerometerRawYText = useAnimatedProps(() => {
    return {
      // Важно: в нативном Text свойство называется 'text' (через пропсы)
      text: `accelerometerRawY: ${accelerometerRawData.value.y.toFixed(2)}`
    } as any;
  });

  const accelerometerRawZText = useAnimatedProps(() => {
    return {
      // Важно: в нативном Text свойство называется 'text' (через пропсы)
      text: `accelerometerRawZ: ${accelerometerRawData.value.z.toFixed(2)}`
    } as any;
  });

  const accelerometerStartDataText = useAnimatedProps(() => {
    return {
      // Важно: в нативном Text свойство называется 'text' (через пропсы)
      text: `accelerometerStartData: x=${accelerometerStartData.value.x.toFixed(2)} y=${accelerometerStartData.value.y.toFixed(2)} z=${accelerometerStartData.value.z.toFixed(2)}`
    } as any;
  });

  const compassDataText = useAnimatedProps(() => {
    return {
      // Важно: в нативном Text свойство называется 'text' (через пропсы)
      text: `compassData: ${compassData.value.toFixed(2)}`
    } as any;
  });

  const compassRawDataText = useAnimatedProps(() => {
    return {
      // Важно: в нативном Text свойство называется 'text' (через пропсы)
      text: `compassRawData: ${compassRawData.value.toFixed(2)}`
    } as any;
  });

  const compassStartDataText = useAnimatedProps(() => {
    return {
      // Важно: в нативном Text свойство называется 'text' (через пропсы)
      text: `compassStartData: ${compassStartData.value.toFixed(2)}`
    } as any;
  });

  const rotationSensor = useAnimatedSensor(SensorType.ROTATION, { interval: 20 });

  useDerivedValue(() => {
    if (featureMode === 'manual' && devMode === 'off' && !isRotating && !isPanAnimating) {
      if (!rotationSensor.isAvailable && isSensorsEnable.value) {
        console.log('⚠️ Accelerometer not available');
        isSensorsEnable.value = false;
        return;
      }
      if (!isSensorsEnable.value)
        isSensorsEnable.value = true;

      const RAD_TO_DEG = 180 / Math.PI;

      // Compass
      const yaw = rotationSensor.sensor.value.yaw;
      let yawDeg = -Math.round(yaw * RAD_TO_DEG);
      if (yawDeg < 0)
        yawDeg = yawDeg + 360;


      if (Math.abs(compassStartData.value) < 0.001)
      {
        console.log('setCompassStartData', yawDeg);
        compassStartData.value = yawDeg;
        console.log('setCompassStartData complete', compassStartData.value);
      }
      const nowAngle = yawDeg - compassStartData.value;
      compassData.value = nowAngle;
      compassRawData.value = yawDeg;


      // X, Y, Z
      const pitch = rotationSensor.sensor.value.pitch; // x
      const roll = rotationSensor.sensor.value.roll; // y
      let pitchDeg = Math.round(pitch * RAD_TO_DEG);
      let rollDeg = Math.round(roll * RAD_TO_DEG);

      const zValue = Math.cos(pitch) * Math.cos(roll) * -1;

      const baseValue = {
        x: pitchDeg,
        y: rollDeg,
        z: zValue
      };

      if (Math.abs(accelerometerStartData.value.x + accelerometerStartData.value.y + accelerometerStartData.value.z) < 0.0001)
      {
        console.log('setAccelerometerStartData', baseValue);
        accelerometerStartData.value = baseValue;
        console.log('setAccelerometerStartData complete', accelerometerStartData.value);
      }

      const shiftedValue = {
        x: accelerometerStartData.value.x - baseValue.x,
        y: accelerometerStartData.value.y - baseValue.y,
        z: baseValue.z,
      }

      accelerometerRawData.value = baseValue;
      accelerometerData.value = shiftedValue;
    }
  });


  // ============================================================
  // ОБРАБОТЧИКИ КНОПОК
  // ============================================================
  const handleInfoPress = useCallback(() => {
    if (onInfoButtonPress) {
      onInfoButtonPress();
    }
  }, [onInfoButtonPress]);

  const handleFeatureModeToggle = useCallback(() => {
    const newMode = featureMode === 'animation' ? 'manual' : 'animation';
    onFeatureModeChange?.(newMode);
    // При переключении в animation режим:
    // 1. Включаем принудительный запуск
    // 2. Включаем воспроизведение анимации
    if (newMode === 'animation') {
      setShouldForcePlayOnSignChange(true);
      setIsAnimationPlaying(true);
    }
  }, [featureMode, onFeatureModeChange]);

  // Обработчик кнопки Play/Pause
  const handlePlayPausePress = useCallback(() => {
    setIsAnimationPlaying(prev => !prev);
  }, []);

  // ============================================================
  // ПОЛУЧЕНИЕ ИЗОБРАЖЕНИЙ для текущей и противоположной стороны
  // ============================================================
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

  // ============================================================
  // ОБРАБОТЧИК РАЗМЕРОВ контейнера
  // ============================================================
  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainerSize({ width, height });
      if (!isLayoutReady) {
        setIsLayoutReady(true);
      }
    }
  }, [isLayoutReady]);

  // ============================================================
  // ПОДГОТОВКА ДАННЫХ ДЛЯ РЕНДЕРА
  // ============================================================
  const currentImage = getCurrentImage();
  const oppositeImage = getOppositeImage();
  const signsOnCurrentSide = displaySide === 'obverse' ? obverseSigns : reverseSigns;

  const shouldShowPoints = !isLoadingPictures && isLayoutReady && showSignPoints;
  const shouldShowFeatures = !isLoadingPictures && isLayoutReady && showFeaturesLayer;

  const shouldShowNavButtons = (obverseSigns.length > 0 || reverseSigns.length > 0) && devMode === 'off';
  const areButtonsDisabled = isRotating || isPanAnimating || isLoadingPictures || devMode !== 'off';

  const isLumenMode = typeCode === 'lumen';
  const isLoupeMode = typeCode === 'loupe';
  const isInclineMode = typeCode === 'incline';
  const isTouchMode = typeCode === 'touch';

  console.log("Sign banknote 3d view init");

  // ============================================================
  // РЕНДЕР
  // ============================================================
  return (
    <View style={[styles.container,
      {
        marginTop: screenOrientation === 'PORTRAIT' ? 0 : -40,
        zIndex:0
      }
    ]} onLayout={onContainerLayout}>
      <View style={{ width:'100%', height:'100%',
        position: 'absolute', paddingLeft:insets.left, paddingRight: insets.right, paddingBottom: insets.bottom,
      }}>
        <View style={[styles.banknoteContainer]}>

          {/* РОДИТЕЛЬСКИЙ СЛОЙ - для поворотов, масштаба и анимаций от Kipp */}
          {/* Этот слой позволяет применять дополнительные трансформации поверх основной банкноты */}
          <Animated.View
            style={[
              styles.parent3DView,
              parentAnimatedStyle,
            ]}
          >
            {/* ВНУТРЕННИЙ СЛОЙ - банкнота с навигационными анимациями (pan, scale, rotateY) */}
            <Animated.View
              style={[
                styles.banknote3DView,
                {
                  width: containerSizeCalculated.width * banknoteScaleFactor,
                  height: containerSizeCalculated.height * banknoteScaleFactor,
                },
                banknoteAnimatedStyle,
              ]}
            >
              {/* Лицевая сторона банкноты */}
              <Animated.View
                style={[
                  styles.banknote3DCard,
                  frontAnimatedStyle,
                  {
                    width: containerSizeCalculated.width * banknoteScaleFactor,
                    height: containerSizeCalculated.height * banknoteScaleFactor
                  },
                ]}
              >
                <View
                  style={[
                    styles.imageContainer,
                    {
                      width: containerSizeCalculated.width * banknoteScaleFactor,
                      height: containerSizeCalculated.height * banknoteScaleFactor,
                    },
                  ]}
                >
                  {!isLoadingPictures ? (
                    <Image
                      source={displaySide === 'obverse' ? currentImage : oppositeImage}
                      style={styles.banknoteImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.placeholder}>
                      <Ionicons name="image-outline" size={48} color="#ccc" />
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Оборотная сторона банкноты */}
              <Animated.View
                style={[
                  styles.banknote3DCard,
                  backAnimatedStyle,
                  {
                    width: containerSizeCalculated.width * banknoteScaleFactor,
                    height: containerSizeCalculated.height * banknoteScaleFactor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.imageContainer,
                    {
                      width: containerSizeCalculated.width * banknoteScaleFactor,
                      height: containerSizeCalculated.height * banknoteScaleFactor,
                    },
                  ]}
                >
                  {!isLoadingPictures ? (
                    <Image
                      source={displaySide === 'obverse' ? oppositeImage : currentImage}
                      style={styles.banknoteImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.placeholder}>
                      <Ionicons name="image-outline" size={48} color="#ccc" />
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Точки знаков (интерактивные маркеры) - только в DEV режиме */}
              {enableDevMode && shouldShowPoints && (
                <View style={StyleSheet.absoluteFill}>
                  {signsOnCurrentSide.map((sign, index) => {
                    const position = getSignPointPosition(
                      sign,
                      containerSizeCalculated.width * banknoteScaleFactor,
                      containerSizeCalculated.height * banknoteScaleFactor
                    );
                    const isCurrent = sign.sign_id === currentSign?.sign_id;

                    return (
                      <TouchableOpacity
                        key={`point-${sign.sign_id}`}
                        style={[
                          styles.signPoint,
                          {
                            left: position.left,
                            top: position.top,
                            width: SIGN_POINT_SIZE,
                            height: SIGN_POINT_SIZE,
                            borderRadius: SIGN_POINT_SIZE / 2,
                          },
                        ]}
                        onPress={() => null}
                        activeOpacity={0.7}
                        disabled={isRotating || isPanAnimating || isLoadingPictures || devMode !== 'off'}
                      >
                        <View
                          style={[
                            styles.signPointInner,
                            {
                              backgroundColor: isCurrent ? ACTIVE_SIGN_COLOR : SIGN_POINT_COLOR,
                              borderWidth: isCurrent ? 2 : 1,
                              borderColor: '#FFFFFF',
                            },
                          ]}
                        >
                          <Text style={styles.signPointIndex}>{index + 1}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Слой признаков (отображает анимированные элементы знаков) */}
              {/* ВАЖНО: Используем allSignsOnCurrentSide (полный массив, включая скрытые знаки) */}
              {/* Это позволяет отображать признаки даже у скрытых от навигации знаков */}
              {shouldShowFeatures && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}>
                  <View
                    style={{
                      width: containerSizeCalculated.width * banknoteScaleFactor,
                      height: containerSizeCalculated.height * banknoteScaleFactor,
                      zIndex: 1,
                      backgroundColor: 'transparent',
                    }}
                  >
                    {/* Рендерим соответствующий слой в зависимости от типа знака */}
                    {isLumenMode && (
                      <LumenSignLayer
                        key={`lumen-layer-${displaySide}`}
                        oppositeSideImage={oppositeImage}
                        modificationPolymer={selectedModification.modification_polymer ?? false}
                        signs={allSignsOnCurrentSide} // ПЕРЕДАЕМ ПОЛНЫЙ МАССИВ (включая скрытые)
                        currentSign={activeSignForFeatures}
                        containerSize={{
                          width: containerSizeCalculated.width * banknoteScaleFactor,
                          height: containerSizeCalculated.height * banknoteScaleFactor,
                        }}
                        banknoteRealSize={{
                          width: selectedModification.bnk_size_width!,
                          height: selectedModification.bnk_size_height!,
                        }}
                        featureMode={featureMode}
                        // Датчики
                        accelerometerData={accelerometerData}
                        compassData={compassData}
                        isCompassEnable={isCompassEnable}
                        // Базовые углы X, Y для родительского слоя
                        baseRotationX={baseRotationXFromChild}
                        baseRotationY={baseRotationYFromChild}
                        // Сдвинутый угол Z для родительского слоя
                        shiftedRotationZ={shiftedRotationZFromChild}
                        // Нормализованные углы для знаков
                        finalRotationX={normRotationXFromChild}
                        finalRotationY={normRotationYFromChild}
                        finalRotationZ={normRotationZFromChild}
                        // ДЛЯ УПРАВЛЕНИЯ ВОСПРОИЗВЕДЕНИЕМ
                        isPlaying={isAnimationPlaying}
                        onAnimationComplete={handleAnimationComplete}
                      />
                    )}
                    {isLoupeMode && (
                      <LoupeSign
                        signs={allSignsOnCurrentSide} // ПЕРЕДАЕМ ПОЛНЫЙ МАССИВ (включая скрытые)
                        currentSign={activeSignForFeatures}
                        banknoteImage={currentImage}
                        banknoteWidth={selectedModification.bnk_size_width!}
                        banknoteHeight={selectedModification.bnk_size_height!}
                        featureMode={featureMode}
                        isPlaying={isAnimationPlaying}
                        onAnimationComplete={handleAnimationComplete}
                      />
                    )}
                    {isInclineMode && (
                      <InclineSignLayer
                        key={`incline-layer-${displaySide}`}
                        signs={allSignsOnCurrentSide} // ПЕРЕДАЕМ ПОЛНЫЙ МАССИВ (включая скрытые)
                        currentSign={activeSignForFeatures}
                        containerSize={{
                          width: containerSizeCalculated.width * banknoteScaleFactor,
                          height: containerSizeCalculated.height * banknoteScaleFactor,
                        }}
                        banknoteRealSize={{
                          width: selectedModification.bnk_size_width!,
                          height: selectedModification.bnk_size_height!,
                        }}
                        featureMode={featureMode}
                        // Датчики
                        accelerometerData={accelerometerData}
                        compassData={compassData}
                        isCompassEnable={isCompassEnable}
                        // Базовые углы X, Y для родительского слоя
                        baseRotationX={baseRotationXFromChild}
                        baseRotationY={baseRotationYFromChild}
                        // Сдвинутый угол Z для родительского слоя
                        shiftedRotationZ={shiftedRotationZFromChild}
                        // Нормализованные углы для знаков
                        finalRotationX={normRotationXFromChild}
                        finalRotationY={normRotationYFromChild}
                        finalRotationZ={normRotationZFromChild}
                        // ДЛЯ УПРАВЛЕНИЯ ВОСПРОИЗВЕДЕНИЕМ
                        isPlaying={isAnimationPlaying}
                        onAnimationComplete={handleAnimationComplete}
                      />
                    )}
                    {isTouchMode && activeSignForFeatures && (
                      <TouchSign
                        sign={activeSignForFeatures}
                        banknoteWidth={selectedModification.bnk_size_width!}
                        banknoteHeight={selectedModification.bnk_size_height!}
                        featureMode={featureMode}
                        isPlaying={isAnimationPlaying}
                        onAnimationComplete={handleAnimationComplete}
                      />
                    )}
                  </View>
                </View>
              )}
            </Animated.View>
          </Animated.View>


        </View>
      </View>

      {/* ============================================================ */}
      {/* НАВИГАЦИЯ В ЗАВИСИМОСТИ ОТ РЕЖИМА */}
      {/* ============================================================ */}
      <View style={{width:'100%', height:'100%', position:'absolute',
                    paddingLeft:insets.left, paddingRight: insets.right, paddingBottom: insets.bottom}}>
        <View style={{width:'100%', height:'100%'}}>

          {/* Режим ANIMATION - стандартные кнопки */}
          {featureMode === 'animation' && shouldShowPoints && devMode === 'off' && (
            <>
              {/* Кнопка информации */}
              <TouchableOpacity
                style={[
                  styles.infoCircleButton,
                  (isRotating || isPanAnimating || isLoadingPictures) && styles.buttonDisabled,
                ]}
                onPress={handleInfoPress}
                disabled={isRotating || isPanAnimating || isLoadingPictures}
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

              {/* КНОПКА PLAY/PAUSE */}
              <TouchableOpacity
                style={[
                  styles.playPauseButton,
                  (isRotating || isPanAnimating || isLoadingPictures) && styles.buttonDisabled,
                ]}
                onPress={handlePlayPausePress}
                disabled={isRotating || isPanAnimating || isLoadingPictures}
                activeOpacity={0.7}
              >
                {isAnimationPlaying && (
                  <Image
                    source={require('@/assets/Image/Resources/Icons/Button-pause.png')}
                    style={{
                      width: 24,
                      height: 24,
                      tintColor: '#000000',
                    }}
                    resizeMode="contain"
                  />
                )}

                {!isAnimationPlaying && (
                  <Image
                    source={require('@/assets/Image/Resources/Icons/Button-play.png')}
                    style={{
                      width: 24,
                      height: 24,
                      tintColor: '#000000',
                    }}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>

              {/* Кнопка переключения режима признаков */}
              {/*<TouchableOpacity*/}
              {/*  style={[*/}
              {/*    styles.featureCircleButton,*/}
              {/*    {*/}
              {/*      backgroundColor: '#FFFFFF',*/}
              {/*    },*/}
              {/*    (isRotating || isPanAnimating || isLoadingPictures) && styles.buttonDisabled,*/}
              {/*  ]}*/}
              {/*  onPress={handleFeatureModeToggle}*/}
              {/*  disabled={isRotating || isPanAnimating || isLoadingPictures}*/}
              {/*  activeOpacity={0.7}*/}
              {/*>*/}
              {/*  <View style={styles.featureButtonContent}>*/}
              {/*    <Image*/}
              {/*      source={require('@/assets/Image/Resources/Icons/Icons-dynamic-mode.png')}*/}
              {/*      style={{*/}
              {/*        width: 42,*/}
              {/*        height: 42,*/}
              {/*        tintColor: '#000000',*/}
              {/*      }}*/}
              {/*      resizeMode="contain"*/}
              {/*    />*/}
              {/*  </View>*/}
              {/*</TouchableOpacity>*/}
            </>
          )}

          {/* Навигационные стрелки (только в animation режиме) */}
          {shouldShowNavButtons && (
            <>
              <TouchableOpacity
                style={[styles.navArrow, styles.navArrowLeft]}
                onPress={() => navigateToSign('next')}
                disabled={areButtonsDisabled}
              >
                <ChevronLeft size={32} color={areButtonsDisabled ? '#CCCCCC' : '#000000'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navArrow, styles.navArrowRight]}
                onPress={() => navigateToSign('prev')}
                disabled={areButtonsDisabled}
              >
                <ChevronRight size={32} color={areButtonsDisabled ? '#CCCCCC' : '#000000'} />
              </TouchableOpacity>
            </>
          )}

           {/*Кнопка переключения режима для ручного режима (внизу справа) */}
          {featureMode === 'animation' && (
            <TouchableOpacity
              style={[
                styles.featureCircleButton,
                styles.manualModeToggleButton,
                (isRotating || isPanAnimating || isLoadingPictures) && styles.buttonDisabled,
              ]}
              onPress={handleFeatureModeToggle}
              disabled={isRotating || isPanAnimating || isLoadingPictures}
              activeOpacity={0.7}
            >
              <View style={styles.featureButtonContent}>
                <Image
                  source={require('@/assets/Image/Resources/Icons/Icons-dynamic-mode.png')}
                  style={{
                    width: 42,
                    height: 42,
                    tintColor: '#000000',
                  }}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          )}

          {/* Кнопка переключения Dev режима */}
          {enableDevMode && (
            <TouchableOpacity
              style={[
                styles.devToggleButton,
                devMode !== 'off' && styles.devModeActive
              ]}
              onPress={toggleDevMode}
            >
              <Text style={styles.devToggleText}>
                {devMode === 'off' ? '🔧 Dev Off' : '🔧 Dev On'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Панель управления Dev режимом */}
          {enableDevMode && devMode !== 'off' && (
            <View style={styles.devPanel}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.devPanelContent}>
                  <Text style={styles.devPanelTitle}>Родительские повороты и масштаб</Text>

                  {/* Родительский поворот X */}
                  <View style={styles.devControlGroup}>
                    <Text style={styles.devControlLabel}>Поворот X</Text>
                    <View style={styles.devButtonRow}>
                      <TouchableOpacity
                        style={styles.devButton}
                        onPress={() => rotateParentX(-DEV_PARENT_ROTATION_STEP)}
                      >
                        <Text style={styles.devButtonText}>↺ X</Text>
                      </TouchableOpacity>
                      <Text style={styles.devValue}>{devParentRotX.toFixed(0)}°</Text>
                      <TouchableOpacity
                        style={styles.devButton}
                        onPress={() => rotateParentX(DEV_PARENT_ROTATION_STEP)}
                      >
                        <Text style={styles.devButtonText}>X ↻</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Родительский поворот Y */}
                  <View style={styles.devControlGroup}>
                    <Text style={styles.devControlLabel}>Поворот Y</Text>
                    <View style={styles.devButtonRow}>
                      <TouchableOpacity
                        style={styles.devButton}
                        onPress={() => rotateParentY(-DEV_PARENT_ROTATION_STEP)}
                      >
                        <Text style={styles.devButtonText}>↺ Y</Text>
                      </TouchableOpacity>
                      <Text style={styles.devValue}>{devParentRotY.toFixed(0)}°</Text>
                      <TouchableOpacity
                        style={styles.devButton}
                        onPress={() => rotateParentY(DEV_PARENT_ROTATION_STEP)}
                      >
                        <Text style={styles.devButtonText}>Y ↻</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Родительский поворот Z */}
                  <View style={styles.devControlGroup}>
                    <Text style={styles.devControlLabel}>Поворот Z</Text>
                    <View style={styles.devButtonRow}>
                      <TouchableOpacity
                        style={styles.devButton}
                        onPress={() => rotateParentZ(-DEV_PARENT_ROTATION_STEP)}
                      >
                        <Text style={styles.devButtonText}>↺ Z</Text>
                      </TouchableOpacity>
                      <Text style={styles.devValue}>{devParentRotZ.toFixed(0)}°</Text>
                      <TouchableOpacity
                        style={styles.devButton}
                        onPress={() => rotateParentZ(DEV_PARENT_ROTATION_STEP)}
                      >
                        <Text style={styles.devButtonText}>Z ↻</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Родительский масштаб */}
                  <View style={styles.devControlGroup}>
                    <Text style={styles.devControlLabel}>Масштаб</Text>
                    <View style={styles.devButtonRow}>
                      <TouchableOpacity
                        style={styles.devButton}
                        onPress={() => scaleParent(-DEV_PARENT_SCALE_STEP)}
                      >
                        <Text style={styles.devButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.devValue}>{devParentScale.toFixed(2)}x</Text>
                      <TouchableOpacity
                        style={styles.devButton}
                        onPress={() => scaleParent(DEV_PARENT_SCALE_STEP)}
                      >
                        <Text style={styles.devButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Кнопка сброса */}
                  <View style={styles.devButtonRow}>
                    <TouchableOpacity
                      style={[styles.devButton, styles.devButtonWide]}
                      onPress={resetParent}
                    >
                      <Text style={styles.devButtonText}>Сброс</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          )}

          {/* Отладка акселерометра */}
          {enableDevMode && featureMode === 'manual' && devMode === 'off' && (
            <View pointerEvents="none" style={styles.debugContainer}>
              <AnimatedText
                animatedProps={accelerometerXText}
                style={styles.debugText}
              />
              <AnimatedText
                animatedProps={accelerometerYText}
                style={styles.debugText}
              />
              <AnimatedText
                animatedProps={accelerometerZText}
                style={styles.debugText}
              />
              <AnimatedText
                animatedProps={accelerometerRawXText}
                style={styles.debugText}
              />
              <AnimatedText
                animatedProps={accelerometerRawYText}
                style={styles.debugText}
              />
              <AnimatedText
                animatedProps={accelerometerRawZText}
                style={styles.debugText}
              />
              <AnimatedText
                animatedProps={accelerometerStartDataText}
                style={styles.debugText}
              />

              <AnimatedText
                animatedProps={compassDataText}
                style={styles.debugText}
              />
              <AnimatedText
                animatedProps={compassRawDataText}
                style={styles.debugText}
              />
              <AnimatedText
                animatedProps={compassStartDataText}
                style={styles.debugText}
              />
            </View>
          )}
        </View>
      </View>

      {/* Режим MANUAL - навигационное меню с точками */}
      {featureMode === 'manual' && devMode === 'off' && (
        <ManualNavigation
          obverseSigns={obverseSigns}
          reverseSigns={reverseSigns}
          currentSign={activeSignForFeatures}
          currentSide={displaySide}
          onSignSelect={handleManualSignSelect}
          isAnimating={isRotating || isPanAnimating}
        />
      )}
    </View>
  );
}

// ============================================================
// СТИЛИ
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  banknoteContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
    transform: [
      {
        matrix: [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, -1, 1, // -1 отодвигает банкноту ГЛУБЖЕ в экран
        ],
      },
    ],
  },
  parent3DView: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  banknote3DView: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  banknote3DCard: {
    position: 'absolute',
    backfaceVisibility: 'hidden',
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
  },
  signPoint: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  signPointInner: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  signPointIndex: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: SIGN_POINT_SIZE,
    backgroundColor: 'transparent',
  },
  navArrow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
  },
  navArrowLeft: {
    left: 20,
    top: '50%',
    transform: [{ translateY: -28 }],
  },
  navArrowRight: {
    right: 20,
    top: '50%',
    transform: [{ translateY: -28 }],
  },
  infoCircleButton: {
    position: 'absolute',
    left: 24,
    bottom: 24,
    width: INFO_BUTTON_SIZE,
    height: INFO_BUTTON_SIZE,
    borderRadius: INFO_BUTTON_SIZE / 2,
    backgroundColor: '#FFFFFF',
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
    zIndex: 100,
  },
  playPauseButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: FEATURE_BUTTON_SIZE,
    height: FEATURE_BUTTON_SIZE,
    borderRadius: FEATURE_BUTTON_SIZE / 2,
    backgroundColor: '#FFFFFF',
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
    zIndex: 100,
  },
  featureCircleButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: FEATURE_BUTTON_SIZE,
    height: FEATURE_BUTTON_SIZE,
    borderRadius: FEATURE_BUTTON_SIZE / 2,
    backgroundColor: '#FFFFFF',
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
    zIndex: 100,
  },
  manualModeToggleButton: {
    backgroundColor: '#FFFFFF',
  },
  featureButtonContent: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  debugContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
    opacity: 0.5,

  },
  debugText: {
    padding: 0,
    margin: 0,
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
  },

  // СТИЛИ ДЛЯ DEV РЕЖИМА
  devToggleButton: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  devModeActive: {
    backgroundColor: '#FF9500',
  },
  devToggleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  devPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 12,
    padding: 12,
    zIndex: 1000,
    maxHeight: 800,
  },
  devPanelContent: {
    paddingHorizontal: 8,
  },
  devPanelTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  devControlGroup: {
    marginBottom: 8,
  },
  devControlLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
  },
  devButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  devButtonWide: {
    flex: 1,
    marginHorizontal: 4,
  },
  devButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  devValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'center',
  },
});
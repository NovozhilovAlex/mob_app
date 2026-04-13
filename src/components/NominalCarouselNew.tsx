import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
  LayoutChangeEvent,
  ActivityIndicator,
  Text
} from 'react-native';
import {useRouter} from 'expo-router';
import BanknoteCarouselItem from '@/src/components/BanknoteCarouselItem';
import {useNominalStore} from '@/src';
import {dataCacheService} from '@/src/services/DataCacheService';
import {useTranslation} from "react-i18next";
import {useNavigationService} from "@/src/services/NavigationService";
import {useCustomOrientation} from "@/src/hooks/useCustomOrientation";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==================== КОНСТАНТЫ ДЛЯ ОБРАБОТКИ ЖЕСТОВ ====================
const CLICK_THRESHOLD = 5; // Макс. смещение пальца для распознавания клика (в пикселях)
const CLICK_TIME_THRESHOLD = 200; // Макс. время касания для распознавания клика (мс)
const SWIPE_THRESHOLD = 0.1; // Порог смещения для определения свайпа (относительно ширины банкноты)

// ==================== КОНСТАНТЫ ДЛЯ ВЕРСТКИ ====================
const NOMINAL_HEADER_HEIGHT = 36; // Фиксированная высота блока с номиналом (в пикселях)

// ==================== КОНСТАНТЫ ДЛЯ СТАБИЛЬНОГО ZINDEX ====================
// Добавлены для устранения дерганья банкнот при переходе через точку 4.5/-4.5
const CRITICAL_ZONE_SIZE = 0.1; // Размер критической зоны вокруг точки перехода (±0.1)
const TRANSITION_POINT = 10; // Точка перехода банкноты
const ZINDEX_CENTERING = 1500; // Высокий приоритет для банкноты, движущейся к центру
const ZINDEX_LEAVING = 500;   // Низкий приоритет для банкноты, уходящей за край
const ZINDEX_BASE = 2000;     // Базовый zIndex для вне критической зоны

// ==================== ТИПЫ ДАННЫХ ====================
type Banknote = {
  id: number;
  position: number; // Виртуальная позиция в карусели от -4 до 4
  baseId: number; // Постоянный ID банкноты от 1 до 9 для внутренней логики
  nominal_id: number; // ID номинала в базе данных
  nominal_value: number; // Значение номинала (5, 10, 50, ...)
  latest_modification?: any; // Последняя модификация банкноты
  arrayIndex: number; // Индекс в основном массиве всех номиналов (для динамического окна)
};

interface NominalData {
  nominal_id: number;
  nominal_value: number;
  latest_modification?: any;
  elPosition?: number;
}

export default function Gallery3DCarouselNew() {
  const navigationService = useNavigationService();
  const orientation = useCustomOrientation();
  const orientationRef = useRef(orientation);
  const { nominalsWithStats, loadNominalsWithStats } = useNominalStore();
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    orientationRef.current = orientation;
  }, [orientation]);

  // ==================== СОСТОЯНИЯ ДЛЯ РАЗМЕРОВ ====================
  const [containerSize, setContainerSize] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  });
  const containerSizeRef = useRef({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  useEffect(() => {
    containerSizeRef.current = containerSize;
  }, [containerSize]);

  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // ==================== ССЫЛКА ДЛЯ КОНТЕЙНЕРА ЖЕСТОВ ====================
  const gestureAreaRef = useRef<View>(null);
  const DELTA_MOVEMENT_CF = 2.0

  // ==================== СОСТОЯНИЕ ДЛЯ ОТОБРАЖЕНИЯ НОМИНАЛА ====================
  // Хранит текущее значение номинала центральной банкноты для отображения над каруселью
  const [currentNominalValue, setCurrentNominalValue] = useState<number | null>(null);
  // Анимация плавного появления/исчезновения номинала при смене центральной банкноты
  const nominalOpacity = useRef(new Animated.Value(1)).current;
  const isCarouselIdleRef = useRef(true); // Флаг состояния покоя карусели
  const pendingNominalValueRef = useRef<number | null>(null); // Ожидающее значение номинала

  // ==================== КРИТИЧЕСКИЙ ХУК ДЛЯ ОБНОВЛЕНИЯ ====================
  // Этот стейт НЕЛЬЗЯ удалять! Он используется для принудительного обновления компонента
  // при изменении позиций банкнот. Без него карусель не будет перерисовываться.
  const [, setUpdateCounter] = useState(0);

  // ==================== ССЫЛКИ НА ДАННЫЕ ====================
  const banknotesRef = useRef<Banknote[]>([]); // Текущие 9 видимых банкнот
  const allNominalsRef = useRef<NominalData[]>([]); // Все доступные номиналы (отсортированные)

  // ==================== ССЫЛКИ ДЛЯ УПРАВЛЕНИЯ СОСТОЯНИЕМ ====================
  const centerNominalIndexRef = useRef<number>(0); // Индекс центральной банкноты в allNominals
  const centerBanknoteIdRef = useRef(5); // baseId центральной банкноты (всегда 1-9)
  const gestureOffsetRef = useRef(0); // Текущее смещение от жеста (-1 до 1)
  const isAnimatingRef = useRef(false); // Флаг анимации (предотвращает конфликты жестов)
  const snapAnimation = useRef(new Animated.Value(0)).current; // Анимация для плавных переходов

  // ==================== НОВЫЙ РЕФ ДЛЯ ОТСЛЕЖИВАНИЯ НАПРАВЛЕНИЯ ДВИЖЕНИЯ ====================
  // Добавлен для решения проблемы дерганья банкнот при переходе через точку 4.5/-4.5
  // Используется для стабильного определения zIndex в критической зоне
  const lastMoveDirectionRef = useRef<'left' | 'right' | null>(null);

  // ==================== ЗАЩИТА ОТ МНОЖЕСТВЕННЫХ КЛИКОВ ====================
  const isProcessingClickRef = useRef(false);
  const clickTimerRef = useRef<number | null>(null);

  // ==================== ОТСЛЕЖИВАНИЕ ЖЕСТОВ ====================
  const gestureStartRef = useRef<{
    time: number; // Время начала касания
    x: number;    // Начальная координата X
    y: number;    // Начальная координата Y
    isClick: boolean; // Флаг клика (если перемещение < CLICK_THRESHOLD)
    touchInCenterArea: boolean; // Касание в области центральной банкноты
  } | null>(null);

  const targetCenterRef = useRef<number | null>(null); // Целевой центр для анимации

  // ==================== РАСЧЕТ РАЗМЕРОВ БАНКНОТ ====================
  // Все размеры рассчитаны на основе оригинального соотношения сторон банкноты (800x1800)
  const getBanknoteDimensions = useCallback(() => {
    // Используем реальные размеры контейнера карусели, а не всего экрана
    // Вычитаем ТОЛЬКО ВЕРХНИЙ отступ для блока с номиналом
    // Нижний отступ учитываем отдельно в carouselInnerContainer
    const containerHeight = containerSize.height - NOMINAL_HEADER_HEIGHT;

    // Максимум высоты контейнера карусели
    const MAX_HEIGHT = containerHeight;
    const BANKNOTE_ASPECT_RATIO = orientation === 'PORTRAIT' ? 800 / 1800 : 1800 / 800  // Соотношение сторон: ширина:высота = 1:2.25

    const height = MAX_HEIGHT;
    const width = height * BANKNOTE_ASPECT_RATIO;

    return { height, width };
  }, [containerSize.height, containerSize.width]);

  // ==================== ПОЛУЧАЕМ РАЗМЕРЫ ====================
  const { height: BANKNOTE_HEIGHT, width: BANKNOTE_WIDTH } = getBanknoteDimensions();
  const TOTAL_NOTES = 9; // В карусели одновременно отображается 9 банкнот (4 слева, центр, 4 справа)

  // ==================== ПЛАВНОЕ ОБНОВЛЕНИЕ НОМИНАЛА ====================
  // Обновляет значение номинала над каруселью с плавной анимацией появления
  // Номинал показывается ТОЛЬКО когда карусель находится в состоянии покоя
  const updateNominalDisplay = useCallback(() => {
    // Получаем текущую центральную банкноту по baseId
    const centerBanknote = banknotesRef.current.find(b => b.baseId === centerBanknoteIdRef.current);

    if (!centerBanknote) return;

    const newValue = centerBanknote.nominal_value;

    // Если карусель НЕ в покое - запоминаем значение, но не показываем
    if (!isCarouselIdleRef.current) {
      pendingNominalValueRef.current = newValue;
      // Плавно скрываем номинал
      Animated.timing(nominalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      return;
    }

    // Если карусель в покое - обновляем и показываем
    pendingNominalValueRef.current = null;
    setCurrentNominalValue(newValue);

    Animated.timing(nominalOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [nominalOpacity]);

  // ==================== ОБНОВЛЕНИЕ СОСТОЯНИЯ ПОКОЯ ====================
  // Проверяет, находится ли карусель в состоянии покоя
  // Состояние покоя: нет анимации, нет смещения жеста, нет целевого центра
  const checkAndUpdateIdleState = useCallback(() => {
    // Карусель в покое если:
    // 1. Нет активной анимации
    // 2. Нет смещения от жеста
    // 3. Нет целевого центра для анимации
    const isIdle = !isAnimatingRef.current &&
        Math.abs(gestureOffsetRef.current) < 0.01 &&
        targetCenterRef.current === null;

    const wasIdle = isCarouselIdleRef.current;
    isCarouselIdleRef.current = isIdle;

    // Если только что перешли в состояние покоя И есть ожидающее значение номинала
    if (!wasIdle && isIdle && pendingNominalValueRef.current !== null) {
      setCurrentNominalValue(pendingNominalValueRef.current);
      pendingNominalValueRef.current = null;

      Animated.timing(nominalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  // ==================== ОБРАБОТЧИК ИЗМЕНЕНИЯ РАЗМЕРОВ ====================
  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    // Только если размеры валидны и изменились
    if (width > 0 && height > 0) {
      setContainerSize({ width, height });

      if (!isLayoutReady) {
        setIsLayoutReady(true);
      }
    }
  }, [isLayoutReady]);

  // ==================== ЭФФЕКТЫ ====================
  useEffect(() => {
    loadData();

    // Очистка таймеров при размонтировании компонента
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (nominalsWithStats.length > 0) {
      processNominals();
    }
  }, [nominalsWithStats]);

  // ==================== ЗАГРУЗКА ДАННЫХ ====================
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Ожидание инициализации кэша - критично для работы приложения
      if (!dataCacheService.isCacheInitialized()) {
        await new Promise(resolve => {
          const checkCache = () => {
            if (dataCacheService.isCacheInitialized()) {
              resolve(true);
            } else {
              setTimeout(checkCache, 100);
            }
          };
          checkCache();
        });
      }
      await loadNominalsWithStats();
    } catch (error) {
      console.error('Ошибка загрузки номиналов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== ОБРАБОТКА НОМИНАЛОВ ====================
  const processNominals = () => {
    if (!nominalsWithStats || nominalsWithStats.length === 0) return;

    const processed: NominalData[] = nominalsWithStats
        .filter(nominal => nominal.nominal_value) // Фильтрация некорректных данных
        .map((nominal, index) => {
          let latestModification = null;
          try {
            // Получение последней модификации для каждого номинала
            const modifications = dataCacheService.getModificationsByNominalId(nominal.nominal_id);
            if (modifications && modifications.length > 0) {
              const sorted = [...modifications].sort((a, b) => {
                const yearA = a.modification_year || 0;
                const yearB = b.modification_year || 0;
                return yearB - yearA; // Сортировка по убыванию года (сначала самые новые)
              });
              latestModification = sorted[0];
            }
          } catch (error) {
            console.warn('Не удалось получить модификацию для номинала:', nominal.nominal_id);
          }

          const centerIndex = Math.floor((nominalsWithStats.length - 1) / 2);
          const elPosition = index - centerIndex;

          return {
            nominal_id: nominal.nominal_id,
            nominal_value: nominal.nominal_value,
            latest_modification: latestModification,
            elPosition: elPosition
          };
        })
        // КРИТИЧЕСКАЯ СОРТИРОВКА: от МЕНЬШЕГО к БОЛЬШЕМУ
        // Это определяет логику движения карусели:
        // - Массив: [5, 10, 50, 100, 200, 500, 1000, 5000]
        // - Движение влево = к меньшему номиналу (индекс - 1)
        // - Движение вправо = к большему номиналу (индекс + 1)
        .sort((a, b) => a.nominal_value - b.nominal_value);

    allNominalsRef.current = processed;

    if (processed.length > 0) {
      initializeBanknotes(processed);
    }
  };

  // ==================== ИНИЦИАЛИЗАЦИЯ БАНКНОТ ====================
  const initializeBanknotes = (allNominals: NominalData[]) => {
    // Поиск индекса номинала 5000 для начальной позиции
    const index5000 = allNominals.findIndex(n => n.nominal_value === 5000);

    // Если 5000 не найден, используем первый элемент массива
    let initialCenterIndex = index5000 !== -1 ? index5000 : 0;

    centerNominalIndexRef.current = initialCenterIndex;

    // Создание начального "окна" из 9 банкнот
    updateBanknotesWindow();
  };

  // ==================== ОБНОВЛЕНИЕ ОКНА ВИДИМЫХ БАНКНОТ ====================
  const updateBanknotesWindow = () => {
    const allNominals = allNominalsRef.current;
    const centerIndex = centerNominalIndexRef.current;

    if (allNominals.length === 0) return;

    const banknotes: Banknote[] = [];

    // Создание "окна" из 9 банкнот: 4 слева, центр, 4 справа
    // Это ключевая логика "скользящего окна":
    // - При каждом перелистывании окно сдвигается
    // - Крайние банкноты заменяются новыми из массива
    // - Пользователь видит только 9 банкнот, но может листать бесконечно
    for (let i = -4; i <= 4; i++) {
      let nominalIndex = centerIndex + i;

      // ЦИКЛИЧЕСКАЯ ОБРАБОТКА ГРАНИЦ МАССИВА:
      // Если индекс выходит за пределы массива, он "зацикливается"
      // Это обеспечивает бесконечную карусель
      while (nominalIndex < 0) {
        nominalIndex += allNominals.length;
      }
      while (nominalIndex >= allNominals.length) {
        nominalIndex -= allNominals.length;
      }

      const nominal = allNominals[nominalIndex];
      const baseId = i + 5; // Преобразование позиции (-4..4) в baseId (1..9)

      banknotes.push({
        id: baseId,
        position: i, // Начальная позиция относительно центра
        baseId: baseId,
        nominal_id: nominal.nominal_id,
        nominal_value: nominal.nominal_value,
        latest_modification: nominal.latest_modification,
        arrayIndex: nominalIndex // Важно для отслеживания в основном массиве
      });
    }

    // Сортировка по позиции для корректного отображения
    banknotes.sort((a, b) => a.position - b.position);
    banknotesRef.current = banknotes;

    // Сброс состояния к начальным значениям
    centerBanknoteIdRef.current = 5; // Центральная банкнота всегда имеет baseId = 5
    gestureOffsetRef.current = 0;
    lastMoveDirectionRef.current = null; // Сбрасываем направление движения при инициализации

    // Обновляем отображение номинала при инициализации или сдвиге окна
    updateNominalDisplay();

    // Принудительное обновление компонента
    setUpdateCounter(prev => prev + 1);
  };

  // ==================== ОБНОВЛЕНИЕ ПОЗИЦИЙ БАНКНОТ ====================
  const updateBanknotesPositions = useCallback(() => {
    const currentCenter = centerBanknoteIdRef.current;

    banknotesRef.current.forEach(banknote => {
      const basePosition = banknote.baseId - 5; // Преобразование baseId в позицию (-4..4)
      let relativePosition = basePosition - (currentCenter - 5); // Позиция относительно центра

      // Добавление смещения от жеста пользователя
      let newPosition = relativePosition + gestureOffsetRef.current;

      // КРИТИЧЕСКАЯ НОРМАЛИЗАЦИЯ ПОЗИЦИЙ:
      // Когда банкнота выходит за пределы [-4.5, 4.5], она "перескакивает" на другую сторону
      // Это создает эффект бесконечной карусели
      if (newPosition > 4.5) {
        newPosition -= TOTAL_NOTES; // >4.5 → переходит на -4
      } else if (newPosition < -4.5) {
        newPosition += TOTAL_NOTES; // <-4.5 → переходит на 4
      }

      banknote.position = newPosition;
    });

    // Сортировка для правильного zIndex
    // Банкноты ближе к центру должны быть выше по zIndex
    // Добавлена дополнительная стабилизация: при равных позициях сортируем по baseId
    banknotesRef.current.sort((a, b) => {
      const distA = Math.abs(a.position);
      const distB = Math.abs(b.position);

      // Если расстояния очень близки (разница меньше 0.1)
      if (Math.abs(distA - distB) < 0.1) {
        // Используем baseId как стабильный ключ для сортировки
        // Это гарантирует одинаковый порядок при равных позициях
        return a.baseId - b.baseId;
      }

      return distA - distB;
    });

    // Проверяем состояние покоя после каждого обновления позиций
    checkAndUpdateIdleState();

    // Принудительное обновление компонента для перерисовки
    setUpdateCounter(prev => prev + 1);
  }, [checkAndUpdateIdleState]);

  // ==================== ПЛАВНЫЙ ПЕРЕХОД К НОВОМУ ЦЕНТРУ ====================
  const smoothTransitionToCenter = (newCenterId: number, direction: 'left' | 'right') => {
    if (isAnimatingRef.current) {
      console.log('Анимация уже выполняется, игнорируем новый запрос');
      return;
    }

    isAnimatingRef.current = true;
    isCarouselIdleRef.current = false; // Карусель НЕ в покое

    // Скрываем номинал при начале движения
    Animated.timing(nominalOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    const startCenterId = centerBanknoteIdRef.current;
    const startOffset = gestureOffsetRef.current;

    targetCenterRef.current = newCenterId;
    snapAnimation.setValue(0); // Сброс анимации

    const animationId = snapAnimation.addListener(({ value }) => {
      // Плавное уменьшение смещения жеста до 0
      gestureOffsetRef.current = startOffset * (1 - value);

      // Интерполяция центральной позиции
      const interpolatedCenter = startCenterId + (newCenterId - startCenterId) * value;

      // Временное обновление позиций для плавной анимации
      banknotesRef.current.forEach(banknote => {
        const basePosition = banknote.baseId - 5;
        let relativePosition = basePosition - (interpolatedCenter - 5);
        let newPosition = relativePosition + gestureOffsetRef.current;

        // Нормализация позиций во время анимации
        if (newPosition > 4.5) {
          newPosition -= TOTAL_NOTES;
        } else if (newPosition < -4.5) {
          newPosition += TOTAL_NOTES;
        }

        banknote.position = newPosition;
      });

      setUpdateCounter(prev => prev + 1);
    });

    // Запуск анимации
    Animated.timing(snapAnimation, {
      toValue: 1,
      duration: 350, // Увеличена длительность для плавности
      useNativeDriver: false, // Не использовать нативный драйвер для кастомной логики
    }).start(() => {
      snapAnimation.removeListener(animationId);

      // Фиксация нового центра после анимации
      centerBanknoteIdRef.current = newCenterId;
      gestureOffsetRef.current = 0;
      targetCenterRef.current = null;
      lastMoveDirectionRef.current = null; // Сбрасываем направление после анимации

      // Сдвиг "окна" банкнот в соответствии с направлением
      shiftWindow(direction);

      isAnimatingRef.current = false;
      snapAnimation.setValue(0);

      // Обновляем номинал после завершения анимации перехода к новому центру
      // Номинал покажется только когда карусель будет в покое
      updateNominalDisplay();
      checkAndUpdateIdleState();
    });
  };

  // ==================== СДВИГ ОКНА БАНКНОТ ====================
  const shiftWindow = (direction: 'left' | 'right') => {
    const allNominals = allNominalsRef.current;
    if (allNominals.length === 0) return;

    // ОБНОВЛЕНИЕ ЦЕНТРАЛЬНОГО ИНДЕКСА:
    // Массив отсортирован от меньшего к большему [5, 10, 50, ... 5000]
    // Поэтому:
    // - direction === 'left' → к меньшему номиналу (индекс - 1)
    // - direction === 'right' → к большему номиналу (индекс + 1)
    if (direction === 'left') {
      centerNominalIndexRef.current--;
      if (centerNominalIndexRef.current < 0) {
        centerNominalIndexRef.current = allNominals.length - 1; // Зацикливание
      }
    } else {
      centerNominalIndexRef.current++;
      if (centerNominalIndexRef.current >= allNominals.length) {
        centerNominalIndexRef.current = 0; // Зацикливание
      }
    }

    // Обновление окна банкнот с новым центром
    updateBanknotesWindow();
  };

  // ==================== ДОВОДКА К ЦЕНТРУ ====================
  const snapToCenter = (newCenterId: number) => {
    if (isAnimatingRef.current) {
      console.log('Анимация выполняется, игнорируем доводку');
      return;
    }

    isCarouselIdleRef.current = false; // Карусель НЕ в покое

    // Скрываем номинал при начале движения
    Animated.timing(nominalOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    // ОСОБЫЙ СЛУЧАЙ: возврат к текущему центру
    if (newCenterId === centerBanknoteIdRef.current) {
      // Если смещение уже минимальное, ничего не делаем
      if (Math.abs(gestureOffsetRef.current) < 0.01) {
        isCarouselIdleRef.current = true;
        updateNominalDisplay(); // Показываем номинал
        return;
      }

      // Плавный возврат смещения к 0
      isAnimatingRef.current = true;
      const startOffset = gestureOffsetRef.current;

      snapAnimation.setValue(0);

      const animationId = snapAnimation.addListener(({ value }) => {
        gestureOffsetRef.current = startOffset * (1 - value);
        updateBanknotesPositions();
      });

      Animated.timing(snapAnimation, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        snapAnimation.removeListener(animationId);
        gestureOffsetRef.current = 0;
        updateBanknotesPositions();
        isAnimatingRef.current = false;
        snapAnimation.setValue(0);
        lastMoveDirectionRef.current = null; // Сбрасываем направление

        // Карусель вернулась в центр - теперь в покое
        isCarouselIdleRef.current = true;
        updateNominalDisplay(); // Показываем номинал
      });
      return;
    }

    // Определение направления и запуск плавного перехода
    const direction = newCenterId > centerBanknoteIdRef.current ? 'right' : 'left';
    smoothTransitionToCenter(newCenterId, direction);
  };

  // ==================== ПОЛУЧЕНИЕ СЛЕДУЮЩЕЙ ЦЕНТРАЛЬНОЙ БАНКНОТЫ ====================
  const getNextCenterBanknoteId = (currentId: number, direction: 'left' | 'right'): number => {
    // Логика циклического перехода baseId (1-9)
    if (direction === 'left') {
      let nextId = currentId - 1;
      if (nextId < 1) nextId = 9; // Зацикливание: 1 → 9
      return nextId;
    } else {
      let nextId = currentId + 1;
      if (nextId > 9) nextId = 1; // Зацикливание: 9 → 1
      return nextId;
    }
  };

  // ==================== ПОЛУЧЕНИЕ ЦЕНТРАЛЬНОЙ БАНКНОТЫ ====================
  const getCenterBanknote = (): Banknote | null => {
    const centerId = centerBanknoteIdRef.current;
    return banknotesRef.current.find(b => b.baseId === centerId) || null;
  };

  // ==================== ПРОВЕРКА КАСАНИЯ ОБЛАСТИ ЦЕНТРАЛЬНОЙ БАНКНОТЫ ====================
  const isTouchInCenterArea = useCallback((touchX: number, touchY: number): boolean => {
    // ТОЧНЫЙ РАСЧЕТ ГРАНИЦ ЦЕНТРАЛЬНОЙ БАНКНОТЫ:
    // Проверка только внутри прямоугольника банкноты, без отступов

    const localBnkWidth = orientationRef.current === 'PORTRAIT' ? BANKNOTE_WIDTH : BANKNOTE_HEIGHT;
    const localBnkHeight = orientationRef.current === 'PORTRAIT' ? BANKNOTE_HEIGHT : BANKNOTE_WIDTH;

    console.log('isTouchInCenterArea', touchX, touchY, localBnkWidth, localBnkHeight, containerSizeRef.current.width, containerSizeRef.current.height);
    // Если размеры еще не определены, используем приблизительные
    const currentWidth = localBnkWidth || containerSizeRef.current.width;
    const currentHeight = localBnkHeight || containerSizeRef.current.height;

    // Учитываем отступы внутри контейнера карусели
    const containerCenterX = containerSizeRef.current.width / 2;
    const containerCenterY = (containerSizeRef.current.height - NOMINAL_HEADER_HEIGHT) / 2 + NOMINAL_HEADER_HEIGHT;

    const left = containerCenterX - currentWidth / 2;
    const right = containerCenterX + currentWidth / 2;
    const top = containerCenterY - currentHeight / 2;
    const bottom = containerCenterY + currentHeight / 2;

    const inHorizontal = touchX >= left && touchX <= right;
    const inVertical = touchY >= top && touchY <= bottom;

    return inHorizontal && inVertical;
  }, [containerSizeRef.current.width, containerSizeRef.current.height, orientationRef.current, BANKNOTE_WIDTH, BANKNOTE_HEIGHT]);

  // ==================== ОБРАБОТКА КЛИКА НА ЦЕНТРАЛЬНУЮ БАНКНОТУ ====================
  const handleCenterBanknoteClick = () => {
    // Защита от множественных кликов
    if (isProcessingClickRef.current) {
      console.log('Клик уже обрабатывается, игнорируем...');
      return;
    }

    const centerBanknote = getCenterBanknote();
    if (!centerBanknote) {
      console.log('Центральная банкнота не найдена');
      return;
    }

    isProcessingClickRef.current = true;

    // Навигация к странице модификации
    // router.push({
    //   pathname: "/modification",
    //   params: {
    //     nominalId: centerBanknote.nominal_id,
    //     nominalValue: centerBanknote.nominal_value.toString()
    //   }
    // });
    navigationService.openModificationPage(centerBanknote.latest_modification.modification_id);

    // Сброс флага через 500мс
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      isProcessingClickRef.current = false;
      clickTimerRef.current = null;
    }, 500);
  };

  // ==================== РАСЧЕТ СТИЛЕЙ ДЛЯ БАНКНОТ ====================
  // ИСПРАВЛЕНИЕ: Добавлена логика стабильного zIndex с учетом направления движения
  // Полностью устраняет дерганье банкнот при переходе через точку 4.5/-4.5
  const getBanknoteStyle = useCallback((position: number) => {
    const distance = Math.abs(position);

    // МАСШТАБИРОВАНИЕ:
    // - Центральная банкнота: scale = 1.0
    // - Крайняя банкнота: scale = 0.4
    // - Плавный градиент между ними
    const scale = 0.4 + 0.6 * (1 - distance / 5);

    // ГОРИЗОНТАЛЬНОЕ СМЕЩЕНИЕ - РАВНОМЕРНОЕ РАСПРЕДЕЛЕНИЕ:
    // Используем линейную функцию для равномерного распределения банкнот
    // Увеличиваем коэффициент для лучшего визуального разделения
    const baseSpacing = orientation === 'PORTRAIT'
      ? BANKNOTE_WIDTH * 0.115
      : BANKNOTE_HEIGHT * 0.115;
    ;
    const translateX = -position * baseSpacing;

    // ВЕРТИКАЛЬНОЕ СМЕЩЕНИЕ ДЛЯ ГЛУБИНЫ:
    // Банкноты дальше от центра располагаются чуть ниже для создания эффекта глубины
    const translateY = distance * 2;

    // ЭФФЕКТ ПОЯВЛЕНИЯ/ИСЧЕЗНОВЕНИЯ:
    // Банкноты, которые "выходят" за границы карусели, плавно исчезают
    let opacity = 1;
    let opacityPosition = orientation === 'PORTRAIT' ? 4 : 2;
    if (position > opacityPosition) {
      opacity = Math.max(0, 1 - (position - opacityPosition) * 2);
    } else if (position < -opacityPosition) {
      opacity = Math.max(0, 1 - Math.abs(position + opacityPosition) * 2);
    }

    // ПЛАВНОЕ ПОЯВЛЕНИЕ С ДРУГОЙ СТОРОНЫ:
    // Когда банкнота появляется с противоположной стороны, она плавно проявляется
    if (position < -opacityPosition && position > -opacityPosition - 0.5) {
      opacity = Math.min(1, (position + opacityPosition + 0.5) * 2);
    } else if (position > opacityPosition && position < opacityPosition + 0.5) {
      opacity = Math.min(1, (opacityPosition + 0.5 - position) * 2);
      opacity = Math.min(1, (opacityPosition + 0.5 - position) * 2);
    }

    // ========== ИСПРАВЛЕНИЕ ПРОБЛЕМЫ ДЕРГАНЬЯ ==========
    // Используем направление движения для стабильного определения приоритета
    // в критической зоне вокруг точки перехода (4.5 или -4.5)

    // ========== ИСПРАВЛЕНИЕ: КРАЙНИЕ БАНКНОТЫ С НИЗКИМ OPACITY ==========
    // Банкнота которая с краю начинает исчезать у нее должен быть zindex самый низкий
    // Это создает правильную иерархию отображения - исчезающие банкноты уходят на задний план
    let zIndex;

    // ПРОВЕРКА: Если банкнота почти невидима (opacity < 0.5) - самый низкий приоритет
    // Такие банкноты уже практически исчезли и не должны перекрывать видимые банкноты
    if (opacity < 0.5) {
      zIndex = 1; // Минимальный zIndex для исчезающих банкнот
    }
        // ПРОВЕРКА: Банкноты в процессе появления (тоже низкий приоритет)
    // Они только начинают появляться с другой стороны и пока должны быть под основными банкнотами
    else if (opacity < 0.8 && (position < -opacityPosition || position > opacityPosition)) {
      zIndex = 2; // Чуть выше, чем полностью исчезающие, но все еще низкий
    }
    else {
      // Проверяем, находимся ли мы в критической зоне
      const isInCriticalZone = Math.abs(Math.abs(position) - TRANSITION_POINT) < CRITICAL_ZONE_SIZE;

      if (isInCriticalZone) {
        // ===== КРИТИЧЕСКАЯ ЗОНА - ИСПОЛЬЗУЕМ НАПРАВЛЕНИЕ ДВИЖЕНИЯ =====
        // В этой зоне две банкноты имеют почти одинаковую позицию
        // Нам нужно четко определить, какая из них должна быть выше

        if (position > 0) {
          // Правая сторона карусели (банкноты уходят вправо)

          if (lastMoveDirectionRef.current === 'left') {
            // ПОЛЬЗОВАТЕЛЬ СВАЙПИТ ВЛЕВО (к меньшим номиналам)
            // Банкнота с position < 4.5 движется К ЦЕНТРУ - даем ей высокий приоритет
            // Банкнота с position > 4.5 уходит ЗА КРАЙ - даем ей низкий приоритет
            zIndex = position < TRANSITION_POINT ? ZINDEX_CENTERING : ZINDEX_LEAVING;
          } else if (lastMoveDirectionRef.current === 'right') {
            // ПОЛЬЗОВАТЕЛЬ СВАЙПИТ ВПРАВО (к большим номиналам)
            // Банкнота с position < 4.5 уходит ОТ ЦЕНТРА - даем ей низкий приоритет
            // Банкнота с position > 4.5 появляется С ДРУГОЙ СТОРОНЫ - даем ей высокий приоритет
            zIndex = position < TRANSITION_POINT ? ZINDEX_LEAVING : ZINDEX_CENTERING;
          } else {
            // Направление не определено - используем позицию как fallback
            zIndex = position < TRANSITION_POINT ? ZINDEX_CENTERING : ZINDEX_LEAVING;
          }
        } else {
          // Левая сторона карусели (банкноты уходят влево)

          if (lastMoveDirectionRef.current === 'left') {
            // ПОЛЬЗОВАТЕЛЬ СВАЙПИТ ВЛЕВО (к меньшим номиналам)
            // Банкнота с position > -4.5 уходит ОТ ЦЕНТРА - даем ей низкий приоритет
            // Банкнота с position < -4.5 появляется С ДРУГОЙ СТОРОНЫ - даем ей высокий приоритет
            zIndex = position > -TRANSITION_POINT ? ZINDEX_LEAVING : ZINDEX_CENTERING;
          } else if (lastMoveDirectionRef.current === 'right') {
            // ПОЛЬЗОВАТЕЛЬ СВАЙПИТ ВПРАВО (к большим номиналам)
            // Банкнота с position > -4.5 движется К ЦЕНТРУ - даем ей высокий приоритет
            // Банкнота с position < -4.5 уходит ЗА КРАЙ - даем ей низкий приоритет
            zIndex = position > -TRANSITION_POINT ? ZINDEX_CENTERING : ZINDEX_LEAVING;
          } else {
            // Направление не определено - используем позицию как fallback
            zIndex = position > -TRANSITION_POINT ? ZINDEX_CENTERING : ZINDEX_LEAVING;
          }
        }

        // ДОПОЛНИТЕЛЬНАЯ СТАБИЛИЗАЦИЯ: Добавляем смещение на основе позиции
        // Это гарантирует, что даже при одинаковых условиях две банкноты никогда не будут иметь одинаковый zIndex
        if (position > 0) {
          zIndex += (9 - (position < TRANSITION_POINT ? position * 10 : 0));
        } else {
          zIndex += (position > -TRANSITION_POINT ? Math.abs(position) * 10 : 0);
        }

      } else {
        // ===== ВНЕ КРИТИЧЕСКОЙ ЗОНЫ - СТАНДАРТНЫЙ РАСЧЕТ =====
        // zIndex: чем ближе к центру, тем выше слой
        // Используем Math.round для целочисленных значений zIndex
        // Увеличиваем разрыв между уровнями для большей стабильности
        zIndex = ZINDEX_BASE - Math.round(distance * 200);
      }
    }

    // ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА: Банкноты с очень низкой непрозрачностью всегда внизу
    // Абсолютный минимум для почти невидимых банкнот - они не должны ничего перекрывать
    if (opacity < 0.3) {
      zIndex = 0; // Абсолютный минимум
    }

    // ФИНАЛЬНАЯ ПРОВЕРКА: Убеждаемся, что zIndex всегда положительный и целый
    zIndex = Math.max(0, Math.round(zIndex));

    return {
      transform: [
        { translateX: orientation === 'PORTRAIT' ? translateX : translateY },
        { translateY: orientation === 'PORTRAIT' ? translateY : translateX },
        { scale: scale },
      ],
      opacity,
      zIndex: zIndex - 50000,
      width: BANKNOTE_WIDTH,
      height: BANKNOTE_HEIGHT
    };
  }, [BANKNOTE_WIDTH, BANKNOTE_HEIGHT]);

  // ==================== PAN RESPONDER ДЛЯ ОБРАБОТКИ ЖЕСТОВ ====================
  const panResponder = useRef(
      PanResponder.create({
        // 1. Может ли компонент начать обработку жеста?
        onStartShouldSetPanResponder: () => {
          const canRespond = !isAnimatingRef.current && !isProcessingClickRef.current;
          return canRespond;
        },

        // 2. Может ли компонент обработать движение?
        onMoveShouldSetPanResponder: () => {
          const canRespond = !isAnimatingRef.current && !isProcessingClickRef.current;
          return canRespond;
        },

        // 3. Жест начался (палец коснулся экрана)
        onPanResponderGrant: (evt) => {
          if (isAnimatingRef.current || isProcessingClickRef.current) {
            console.log('Анимация или клик в процессе, игнорируем жест');
            return;
          }

          // Получаем координаты касания
          const touchX = evt.nativeEvent.pageX;
          const touchY = evt.nativeEvent.pageY;

          // Получаем координаты и размеры области жестов
          gestureAreaRef.current?.measure((x, y, width, height, pageX, pageY) => {
            // Корректируем координаты относительно области жестов
            const relativeX = touchX - pageX;
            const relativeY = touchY - pageY;

            const isInCenterArea = isTouchInCenterArea(relativeX, relativeY);

            // Запись начальных параметров жеста
            gestureStartRef.current = {
              time: Date.now(),
              x: relativeX,
              y: relativeY,
              isClick: isInCenterArea,
              touchInCenterArea: isInCenterArea
            };

            gestureOffsetRef.current = 0;
            lastMoveDirectionRef.current = null; // Сбрасываем направление при новом жесте

            console.log(`Начало жеста, в центре: ${isInCenterArea}`);
          });
        },

        // 4. Палец движется
        onPanResponderMove: (evt) => {
          if (isAnimatingRef.current || !gestureStartRef.current || isProcessingClickRef.current) {
            return;
          }

          const touchX = evt.nativeEvent.pageX;
          const touchY = evt.nativeEvent.pageY;

          gestureAreaRef.current?.measure((x, y, width, height, pageX, pageY) => {
            // Корректируем координаты относительно области жестов
            const relativeX = touchX - pageX;
            const relativeY = touchY - pageY;

            const startX = gestureStartRef.current!.x;
            const startY = gestureStartRef.current!.y;

            // Расчет общего смещения
            const deltaX = Math.abs(relativeX - startX);
            const deltaY = Math.abs(relativeY - startY);
            const totalDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Если смещение превысило порог - это не клик
            if (totalDelta > CLICK_THRESHOLD && gestureStartRef.current!.isClick) {
              gestureStartRef.current!.isClick = false;
              console.log('Превышен порог клика, распознан свайп');
            }

            // Расчет смещения для карусели
            let deltaMovement = orientationRef.current === 'PORTRAIT'
              ? startX - relativeX
              : startY - relativeY;


            // ===== ОПРЕДЕЛЕНИЕ НАПРАВЛЕНИЯ ДВИЖЕНИЯ =====
            // Добавлено для решения проблемы дерганья zIndex
            // Критически важно для стабильного определения приоритета в зоне перехода
            if (deltaMovement > 1) { // Небольшой гистерезис для стабильности
              lastMoveDirectionRef.current = 'left';
            } else if (deltaMovement < -1) {
              lastMoveDirectionRef.current = 'right';
            }
            // Если движение меньше 1px - сохраняем предыдущее направление

            deltaMovement = deltaMovement * DELTA_MOVEMENT_CF;

            const maxDelta = BANKNOTE_WIDTH;

            console.log('deltaMovement', deltaMovement, maxDelta);

            const clampedDelta = Math.max(-maxDelta, Math.min(maxDelta, deltaMovement));
            const positionOffset = clampedDelta / maxDelta; // Нормализация к [-1, 1]

            gestureOffsetRef.current = positionOffset;
            updateBanknotesPositions();
          });
        },

        // 5. Палец отпущен
        onPanResponderRelease: () => {
          if (isAnimatingRef.current || !gestureStartRef.current || isProcessingClickRef.current) {
            gestureStartRef.current = null;
            return;
          }

          const currentTime = Date.now();
          const gestureDuration = currentTime - gestureStartRef.current.time;
          const currentOffset = gestureOffsetRef.current;

          // РАСПОЗНАВАНИЕ КЛИКА:
          // 1. isClick должен остаться true
          // 2. Время жеста < 200мс
          // 3. Смещение < 10% ширины банкноты
          const isClick = gestureStartRef.current.isClick &&
              gestureDuration < CLICK_TIME_THRESHOLD &&
              Math.abs(currentOffset) < SWIPE_THRESHOLD;

          console.log(`Распознан ${isClick ? 'клик' : 'свайп'}, смещение: ${currentOffset.toFixed(2)}`);

          if (isClick && gestureStartRef.current.touchInCenterArea) {
            handleCenterBanknoteClick();
          } else {
            // ЛОГИКА СВАЙПА:
            const threshold = 0.5; // Порог для срабатывания перехода
            const hasReachedEdge = Math.abs(currentOffset) > 0.5;

            if (hasReachedEdge) {
              // Сильный свайп - плавный переход
              let newCenterId: number;
              let direction: 'left' | 'right';

              if (currentOffset > 0) {
                newCenterId = getNextCenterBanknoteId(centerBanknoteIdRef.current, 'left');
                direction = 'left';
              } else {
                newCenterId = getNextCenterBanknoteId(centerBanknoteIdRef.current, 'right');
                direction = 'right';
              }

              console.log(`Сильный свайп, переход к банкноте ${newCenterId}`);
              smoothTransitionToCenter(newCenterId, direction);
            } else if (Math.abs(currentOffset) > threshold) {
              // Слабый свайп - доводка
              let nextCenterId: number;

              if (currentOffset > 0) {
                nextCenterId = getNextCenterBanknoteId(centerBanknoteIdRef.current, 'left');
              } else {
                nextCenterId = getNextCenterBanknoteId(centerBanknoteIdRef.current, 'right');
              }

              console.log(`Слабый свайп, доводка к банкноте ${nextCenterId}`);
              snapToCenter(nextCenterId);
            } else {
              // Недостаточное смещение - возврат к центру
              console.log('Недостаточное смещение, возврат к центру');
              snapToCenter(centerBanknoteIdRef.current);
            }
          }

          gestureStartRef.current = null;
        },

        // 6. Жест прерван системой
        onPanResponderTerminate: () => {
          if (isAnimatingRef.current || isProcessingClickRef.current) {
            return;
          }

          console.log('Жест прерван системой, возврат к центру');
          snapToCenter(centerBanknoteIdRef.current);
          gestureStartRef.current = null;
          lastMoveDirectionRef.current = null; // Сбрасываем направление при прерывании
        },
      })
  ).current;

  // ==================== РЕНДЕРИНГ БАНКНОТ ====================
  const renderBanknotes = useCallback(() => {
    if (banknotesRef.current.length === 0 || isLoading) {
      console.log('Нет данных для рендеринга или загрузка в процессе');
      return null;
    }

    const banknotes = banknotesRef.current.map((banknote) => {
      const style = getBanknoteStyle(banknote.position);
      const isCentered = Math.abs(banknote.position) < 0.01;

      const nominalData: NominalData = {
        nominal_id: banknote.nominal_id,
        nominal_value: banknote.nominal_value,
        latest_modification: banknote.latest_modification
      };

      return (
          <Animated.View
              key={banknote.id}
              style={[
                styles.banknoteContainer,
                style
              ]}
              pointerEvents="none" // Важно: жесты обрабатываются через PanResponder
          >
            <BanknoteCarouselItem
                nominal={nominalData}
                modification={banknote.latest_modification}
                width={BANKNOTE_WIDTH}
                height={BANKNOTE_HEIGHT}
                isActive={isCentered}
            />
          </Animated.View>
      );
    });

    return banknotes;
  }, [isLoading, getBanknoteStyle, BANKNOTE_WIDTH, BANKNOTE_HEIGHT]);

  // ==================== ФОРМАТИРОВАНИЕ ТЕКСТА НОМИНАЛА ====================
  // Преобразует числовое значение номинала в формат "5000 рублей" или "50 рублей"
  const formatNominalText = (value: number | null) => {
    if (!value) return '';
    return `${value} ${t("common.rubles")}`;
  };

  // ==================== РЕНДЕРИНГ КОМПОНЕНТА ====================
  if (isLoading && !isLayoutReady) {
    return (
        <View
            style={styles.loadingContainer}
            onLayout={onContainerLayout}
        >
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
    );
  }

  return (
      <View style={[styles.mainContainer]} onLayout={onContainerLayout}>
        {/* ========== ВЕРХНИЙ БЛОК ДЛЯ ОТОБРАЖЕНИЯ НОМИНАЛА ========== */}
        {/* Расположен над каруселью, по центру. Отображает номинал центральной банкноты */}
        {/* При смене банкноты текст плавно исчезает и появляется с новым значением */}
        {/* ВАЖНО: Номинал показывается ТОЛЬКО когда карусель находится в состоянии покоя */}
        {orientation === 'PORTRAIT' && (
          <View style={styles.nominalHeaderContainer}>
            <Animated.View style={{ opacity: nominalOpacity }}>
              <Text style={styles.nominalText}>
                {formatNominalText(currentNominalValue)}
              </Text>
            </Animated.View>
          </View>
        )}

        {/* ========== КОНТЕЙНЕР КАРУСЕЛИ ========== */}
        {/* Имеет фиксированную высоту, чтобы не налезать на блок с номиналом */}
        {/* Содержит область жестов и все банкноты с отступом только снизу */}
        <View style={styles.carouselOuterContainer}>
          <View style={styles.carouselInnerContainer}>
            {/* НЕВИДИМАЯ ОБЛАСТЬ ДЛЯ ЖЕСТОВ - ТОЛЬКО В ГРАНИЦАХ КОНТЕЙНЕРА */}
            {/* Расположена точно в области карусели, без выхода за пределы */}
            <View
                ref={gestureAreaRef}
                style={[
                  styles.gestureArea,
                  {
                    width: containerSize.width,
                    height: orientation === 'PORTRAIT'
                      ? containerSize.height - NOMINAL_HEADER_HEIGHT  // Высота с учетом отступа
                      : containerSize.height,
                  }
                ]}
                {...panResponder.panHandlers}
            />
            {renderBanknotes()}
          </View>
        </View>

        {orientation === 'LANDSCAPE' && (
          <View style={[styles.absoluteLayout]}>
            <View style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
            }}>
              <View style={[styles.nominalHeaderContainer]}>
                <Animated.View style={{ opacity: nominalOpacity }}>
                  <Text style={styles.nominalText}>
                    {formatNominalText(currentNominalValue)}
                  </Text>
                </Animated.View>
              </View>
            </View>


          </View>
        )}
      </View>
  );
}

// ==================== СТИЛИ ====================
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-start', // Элементы располагаются сверху вниз
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    width: '100%',
  },
  // ========== СТИЛИ ДЛЯ БЛОКА С НОМИНАЛОМ ==========
  // Расположен над каруселью, белый текст с тенью для читаемости на любом фоне
  nominalHeaderContainer: {
    width: '100%',
    height: NOMINAL_HEADER_HEIGHT, // Фиксированная высота, чтобы карусель знала свои границы
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // Полностью прозрачный фон
    zIndex: 10000, // Поверх всех элементов
  },
  nominalText: {
    color: '#FFFFFF', // Белый цвет для контраста с темным фоном банкнот
    fontSize: 22, // Крупный шрифт для акцента на номинале
  },
  // ========== КОНТЕЙНЕРЫ ДЛЯ КАРУСЕЛИ ==========
  // Внешний контейнер занимает все оставшееся место после блока с номиналом
  carouselOuterContainer: {
    flex: 1, // Занимает все доступное пространство по вертикали
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  // Внутренний контейнер с отступом ТОЛЬКО СНИЗУ, чтобы банкноты не касались нижнего края
  carouselInnerContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gestureArea: {
    position: 'absolute',
    top: 0, // Без отступа сверху - начинается сразу под блоком с номиналом
    left: 0,
    zIndex: 9999, // Поверх всех банкнот
    backgroundColor: 'transparent', // Полностью прозрачная
  },
  banknoteContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
    padding: 0,
    // Минимальные тени для создания глубины
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 16,
    // Прозрачная граница для предотвращения мерцания
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.00)',
  },
  absoluteLayout:{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
});
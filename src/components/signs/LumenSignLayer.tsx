import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  SharedValue,
  useDerivedValue,
  withTiming,
  cancelAnimation,
  useSharedValue,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Sign } from '@/src';
import { HmcSign } from './HmcSign';
import { RotateByXWith2ImagesSign } from "./RotateByXWith2ImagesSign";
import { SignAnimations } from '@/src/animations/sign/SignAnimations';
import { WatermarkSign } from "@/src/components/signs/WatermarkSign";
import { MirrorLayer } from "./MirrorLayer";
import { PaperTextureLayer } from "./PaperTextureLayer";

//   WatermarkMode = 3,
//   PerforationMode = 4,
//   HMCMode = 7,
//   RotateByXWith2Images = 16,

// Логгер с таймстемпами
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString().slice(11, 23);
  if (data) {
    console.log(`[${timestamp}] 📍 LumenSignLayer: ${message}`, data);
  } else {
    console.log(`[${timestamp}] 📍 LumenSignLayer: ${message}`);
  }
};

interface LumenSignLayerProps {
  signs: Sign[];                       // Все знаки на текущей стороне
  currentSign: Sign | null;            // Текущий выбранный знак (для выбора анимации)
  modificationPolymer: boolean;
  containerSize: {
    width: number;
    height: number;
  };
  banknoteRealSize: {
    width: number;
    height: number;
  };
  featureMode?: 'animation' | 'manual';
  accelerometerData: SharedValue<{ x: number; y: number; z: number }>; // Данные акселерометра для manual режима
  compassData: SharedValue<number>;
  isCompassEnable: SharedValue<boolean>;
  oppositeSideImage?: any;              // Изображение противоположной стороны для зеркального слоя

  // Базовые углы X, Y (сырые из анимации) – для родительского слоя
  baseRotationX: SharedValue<number>;
  baseRotationY: SharedValue<number>;
  // Сдвинутый угол Z (rawRotationZ + startRotZAngle) – для родительского слоя
  shiftedRotationZ: SharedValue<number>;

  // Финальные (нормализованные) углы – для знаков
  finalRotationX: SharedValue<number>;
  finalRotationY: SharedValue<number>;
  finalRotationZ: SharedValue<number>;

  // ДЛЯ УПРАВЛЕНИЯ ВОСПРОИЗВЕДЕНИЕМ
  isPlaying: boolean;                   // Флаг воспроизведения анимации
  onAnimationComplete: () => void;       // Колбэк завершения одного цикла
}

type AnimationState =
  | 'idle'
  | 'animating'
  | 'paused'
  | 'returning'
  | 'waiting_return';

// Данные для worklet'ов (сериализуемые)
type WorkletAnimationData = {
  xInput: number[];
  xOutput: number[];
  yInput: number[];
  yOutput: number[];
  zInput: number[];
  zOutput: number[];
  lumenInput: number[];
  lumenOutput: number[];
  isRotateByZ: boolean;
  maxInput: number;
  duration: number;
};

export default function LumenSignLayer({
                                         signs,
                                         currentSign,
                                         modificationPolymer,
                                         containerSize,
                                         banknoteRealSize,
                                         featureMode = 'animation',
                                         accelerometerData,
                                         compassData,
                                         isCompassEnable,
                                         oppositeSideImage,
                                         baseRotationX,
                                         baseRotationY,
                                         shiftedRotationZ,
                                         finalRotationX,
                                         finalRotationY,
                                         finalRotationZ,
                                         isPlaying,
                                         onAnimationComplete,
                                       }: LumenSignLayerProps) {
  // ============================================================
  // СОСТОЯНИЯ
  // ============================================================
  // Состояние для отслеживания первой загрузки
  const [isInitialized, setIsInitialized] = useState(false);

  // ============================================================
  // REANIMATED SHARED VALUES (основные анимационные значения)
  // ============================================================
  const rotationX = useSharedValue(0);
  const rotationY = useSharedValue(0);
  const rotationZ = useSharedValue(0);

  // Shared value для управления прозрачностью водяного знака (lumen)
  // Значение от 0 до 1, где 1 - полностью видимый, 0 - полностью прозрачный
  const lumen = useSharedValue(0);

  // Прогресс анимации (0-1)
  const progress = useSharedValue(0);

  const animationState = useSharedValue<AnimationState>('idle');

  // Сохранённые значения на момент паузы
  const pausedProgress = useSharedValue(0);
  const pausedX = useSharedValue(0);
  const pausedY = useSharedValue(0);
  const pausedZ = useSharedValue(0);
  const pausedLumen = useSharedValue(0);

  const animatedStartRotZ = useSharedValue(currentSign?.sign_view_rotate_angle || 0);

  const currentSignIdRef = useRef<number | undefined>(currentSign?.sign_id);

  // Данные для worklet'ов (храним в отдельных ref, не в shared values)
  const workletDataRef = useRef<WorkletAnimationData | null>(null);

  // Для JS стороны
  const animationConfigRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const isImageStatic = useDerivedValue(() => false);

  // ============================================================
  // ПРЕОБРАЗОВАНИЕ КОНФИГУРАЦИИ АНИМАЦИИ
  // ============================================================

  /**
   * Преобразование конфигурации анимации в сериализуемые данные для worklet'ов
   * Извлекаем входные/выходные данные для всех осей (X, Y, Z) и для lumen
   */
  const prepareWorkletData = (config: any): WorkletAnimationData | null => {
    if (!config) return null;

    return {
      xInput: config.rotations.x.input,
      xOutput: config.rotations.x.output,
      yInput: config.rotations.y.input,
      yOutput: config.rotations.y.output,
      zInput: config.rotations.z.input,
      zOutput: config.rotations.z.output,
      lumenInput: config.lumen?.input || [],
      lumenOutput: config.lumen?.output || [],
      isRotateByZ: config.isRotateByZ || false,
      maxInput: config.rotations.x.input[config.rotations.x.input.length - 1],
      duration: config.duration || 3000
    };
  };

  /**
   * Выбор конфигурации анимации в зависимости от типа знака
   * - WatermarkMode (3) и PerforationMode (4) используют HMCDemonstrationByLumen
   * - HMCMode (7) использует HMCDemonstrationByLumen
   * - RotateByXWith2Images (16) использует RotateXByLumen
   */
  const animationConfig = useMemo(() => {
    if (!currentSign) {
      animationConfigRef.current = null;
      workletDataRef.current = null;
      return null;
    }

    let config = null;

    switch (currentSign.sign_show_type) {
      case 3: // WatermarkMode
      case 4: // PerforationMode
        config = SignAnimations.Lumen;
        break;
      case 7: // HMCMode
        config = SignAnimations.HMCDemonstrationByLumen;
        break;
      case 16: // RotateByXWith2Images
        config = SignAnimations.RotateXByLumen;
        break;
      default:
        config = null;
    }

    animationConfigRef.current = config;
    workletDataRef.current = prepareWorkletData(config);

    if (config?.duration) {
      log(`📊 Длительность анимации установлена: ${config.duration}ms`);
    }
    return config;
  }, [currentSign]);

  /**
   * Эффект для плавного обновления animatedStartRotZ при изменении sign_view_rotate_angle
   * Используется для начального угла поворота знака
   */
  useEffect(() => {
    const targetAngle = currentSign?.sign_view_rotate_angle || 0;
    animatedStartRotZ.value = withTiming(targetAngle, { duration: 1500 });
  }, [currentSign?.sign_view_rotate_angle]);

  // ============================================================
  // ФУНКЦИИ ДЛЯ ИНТЕРПОЛЯЦИИ УГЛОВ (WORKLET-БЕЗОПАСНЫЕ)
  // ============================================================

  /**
   * Получить значение по прогрессу анимации для указанной оси или lumen
   * Использует только переданные данные, без доступа к ref (worklet-safe)
   * @param progressValue - прогресс анимации (0-1)
   * @param data - данные анимации (входные/выходные массивы)
   * @param axis - ось ('x', 'y', 'z', 'lumen')
   * @returns интерполированное значение
   */
  const getValueAtProgress = useCallback((
    progressValue: number,
    data: WorkletAnimationData,
    axis: 'x' | 'y' | 'z' | 'lumen'
  ) => {
    'worklet';

    let input: number[];
    let output: number[];

    // Выбираем соответствующий массив входных/выходных данных в зависимости от оси
    if (axis === 'x') {
      input = data.xInput;
      output = data.xOutput;
    } else if (axis === 'y') {
      input = data.yInput;
      output = data.yOutput;
    } else if (axis === 'z') {
      // Для оси Z проверяем, нужно ли вращение
      if (!data.isRotateByZ) return 0;
      input = data.zInput;
      output = data.zOutput;
    } else { // lumen
      if (!data.lumenInput.length) return 0;
      input = data.lumenInput;
      output = data.lumenOutput;
    }

    // Нормализуем прогресс от 0-maxInput для интерполяции
    const normalizedProgress = progressValue * data.maxInput;

    // Интерполируем значение по входным/выходным точкам
    return interpolate(normalizedProgress, input, output);
  }, []);

  // ============================================================
  // АНИМАЦИЯ ЧЕРЕЗ FRAME CALLBACK
  // ============================================================

  /**
   * Остановка анимации и очистка requestAnimationFrame
   */
  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastTimestampRef.current = null;
  }, []);

  /**
   * Функция обновления кадра анимации (вызывается из requestAnimationFrame)
   * Обновляет прогресс и все значения (углы X, Y, Z и lumen)
   */
  const updateFrame = useCallback((timestamp: number) => {
    const data = workletDataRef.current;
    if (!data) return;

    // Инициализация первого кадра
    if (lastTimestampRef.current === null) {
      lastTimestampRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(updateFrame);
      return;
    }

    // Вычисляем прошедшее время с последнего кадра
    const delta = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    // Обновляем прогресс на основе прошедшего времени
    let newProgress = progress.value + (delta / data.duration);

    // Проверяем, не достигли ли конца анимации
    if (newProgress >= 1) {
      const remainder = newProgress - 1;
      progress.value = remainder;

      // Получаем значения для всех осей и lumen при завершении цикла
      const newX = getValueAtProgress(progress.value, data, 'x');
      const newY = getValueAtProgress(progress.value, data, 'y');
      const newZ = data.isRotateByZ ? getValueAtProgress(progress.value, data, 'z') : 0;
      const newLumen = getValueAtProgress(progress.value, data, 'lumen');

      // Обновляем shared values
      rotationX.value = newX;
      rotationY.value = newY;
      rotationZ.value = newZ;
      lumen.value = newLumen;

      // Вызываем колбэк завершения анимации
      onAnimationComplete();
    } else {
      // Продолжаем анимацию - обновляем прогресс
      progress.value = newProgress;

      // Получаем значения для всех осей и lumen на текущем прогрессе
      const newX = getValueAtProgress(progress.value, data, 'x');
      const newY = getValueAtProgress(progress.value, data, 'y');
      const newZ = data.isRotateByZ ? getValueAtProgress(progress.value, data, 'z') : 0;
      const newLumen = getValueAtProgress(progress.value, data, 'lumen');

      // Обновляем shared values
      rotationX.value = newX;
      rotationY.value = newY;
      rotationZ.value = newZ;
      lumen.value = newLumen;
    }

    // Продолжаем анимацию, если состояние всё ещё 'animating'
    if (animationState.value === 'animating') {
      animationFrameRef.current = requestAnimationFrame(updateFrame);
    }
  }, [onAnimationComplete, getValueAtProgress]);

  /**
   * Запуск анимации с текущего прогресса
   * Устанавливает начальные значения и запускает цикл обновления кадров
   */
  const startAnimation = useCallback(() => {
    const data = workletDataRef.current;
    if (!data) {
      log('❌ Нет данных для запуска анимации');
      return;
    }

    log(`▶️ Запуск анимации с прогресса: ${progress.value.toFixed(3)}, длительность: ${data.duration}ms`);

    // Устанавливаем начальные значения на основе текущего прогресса
    const newX = getValueAtProgress(progress.value, data, 'x');
    const newY = getValueAtProgress(progress.value, data, 'y');
    const newZ = data.isRotateByZ ? getValueAtProgress(progress.value, data, 'z') : 0;
    const newLumen = getValueAtProgress(progress.value, data, 'lumen');

    rotationX.value = newX;
    rotationY.value = newY;
    rotationZ.value = newZ;
    lumen.value = newLumen;

    // Устанавливаем состояние анимации
    animationState.value = 'animating';
    lastTimestampRef.current = null;

    // Запускаем цикл обновления кадров
    animationFrameRef.current = requestAnimationFrame(updateFrame);
  }, [updateFrame, getValueAtProgress]);

  /**
   * Пауза анимации
   * Сохраняет текущие значения прогресса, углов и lumen для последующего возобновления
   */
  const pauseAnimation = useCallback(() => {
    if (animationState.value === 'animating') {
      const currentProgress = progress.value;
      const currentRotX = rotationX.value;
      const currentRotY = rotationY.value;
      const currentRotZ = rotationZ.value;
      const currentLumen = lumen.value;

      log(`⏸️ Пауза: прогресс=${currentProgress.toFixed(3)}, углы X=${currentRotX.toFixed(2)}°, Y=${currentRotY.toFixed(2)}°, Z=${currentRotZ.toFixed(2)}°, Lumen=${currentLumen.toFixed(2)}`);

      // Сохраняем значения для возобновления
      pausedProgress.value = currentProgress;
      pausedX.value = currentRotX;
      pausedY.value = currentRotY;
      pausedZ.value = currentRotZ;
      pausedLumen.value = currentLumen;

      // Останавливаем анимацию
      stopAnimation();
      animationState.value = 'paused';
    }
  }, [stopAnimation]);

  /**
   * Возобновление анимации после паузы
   * Восстанавливает сохранённые значения и запускает анимацию
   */
  const resumeAnimation = useCallback(() => {
    if (animationState.value === 'paused') {
      const resumeProgress = pausedProgress.value;
      const resumeX = pausedX.value;
      const resumeY = pausedY.value;
      const resumeZ = pausedZ.value;
      const resumeLumen = pausedLumen.value;

      log(`▶️ Возобновление: прогресс=${resumeProgress.toFixed(3)}, углы X=${resumeX.toFixed(2)}°, Y=${resumeY.toFixed(2)}°, Z=${resumeZ.toFixed(2)}°, Lumen=${resumeLumen.toFixed(2)}`);

      // Восстанавливаем сохранённые значения
      progress.value = resumeProgress;
      rotationX.value = resumeX;
      rotationY.value = resumeY;
      rotationZ.value = resumeZ;
      lumen.value = resumeLumen;

      // Запускаем анимацию
      startAnimation();
    }
  }, [startAnimation]);

  /**
   * Возврат в нулевое положение
   * Плавно сбрасывает все значения в 0 (углы) и lumen в 0
   * @param shouldStartAfterReturn - нужно ли запустить анимацию после возврата
   */
  const returnToZero = useCallback((shouldStartAfterReturn: boolean = false) => {
    log(`⬅️ Возврат в 0. shouldStartAfterReturn=${shouldStartAfterReturn}`);

    // Останавливаем текущую анимацию
    stopAnimation();

    // Устанавливаем состояние в зависимости от того, нужно ли запускать после возврата
    animationState.value = shouldStartAfterReturn ? 'waiting_return' : 'returning';

    // Анимируем прогресс до 0
    progress.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        // После завершения возврата, если нужно запустить анимацию - запускаем
        if (animationState.value === 'waiting_return' && isPlaying) {
          startAnimation();
        } else if (animationState.value === 'returning') {
          animationState.value = 'idle';
        }
      }
    });

    // Плавно сбрасываем все углы в 0
    rotationX.value = withTiming(0, { duration: 300 });
    rotationY.value = withTiming(0, { duration: 300 });
    rotationZ.value = withTiming(0, { duration: 300 });
    // Сбрасываем lumen в 0 (полностью прозрачный)
    lumen.value = withTiming(0, { duration: 300 });
  }, [isPlaying, startAnimation, stopAnimation]);

  // ============================================================
  // ОБРАБОТКА СМЕНЫ ЗНАКА
  // ============================================================
  useEffect(() => {
    // Инициализация при первой загрузке
    if (!isInitialized) {
      rotationX.value = 0;
      rotationY.value = 0;
      rotationZ.value = 0;
      lumen.value = 0;
      progress.value = 0;
      animationState.value = 'idle';
      setIsInitialized(true);
      currentSignIdRef.current = currentSign?.sign_id;
      return;
    }

    // Обработка смены знака
    if (currentSignIdRef.current !== currentSign?.sign_id) {
      log(`🔄 Смена знака с ${currentSignIdRef.current} на ${currentSign?.sign_id}`);

      // Останавливаем текущую анимацию
      stopAnimation();

      currentSignIdRef.current = currentSign?.sign_id;

      // Сбрасываем значения в зависимости от текущего состояния
      if (animationState.value === 'animating') {
        returnToZero(false);
      } else if (animationState.value === 'paused') {
        returnToZero(false);
      } else {
        // Плавно сбрасываем все значения
        rotationX.value = withTiming(0, { duration: 300 });
        rotationY.value = withTiming(0, { duration: 300 });
        rotationZ.value = withTiming(0, { duration: 300 });
        progress.value = withTiming(0, { duration: 300 });
        lumen.value = withTiming(0, { duration: 300 });
        animationState.value = 'idle';
      }
    }
  }, [currentSign?.sign_id, isInitialized, returnToZero, stopAnimation]);

  // ============================================================
  // ОБРАБОТКА PLAY/PAUSE
  // ============================================================
  useEffect(() => {
    // Игнорируем, если не animation режим, нет конфигурации или не инициализированы
    if (featureMode !== 'animation' || !animationConfig || !isInitialized) {
      return;
    }

    log(`🎮 Смена isPlaying на ${isPlaying}, текущее состояние: ${animationState.value}`);

    if (isPlaying) {
      // Запуск анимации
      switch (animationState.value) {
        case 'idle':
          log('🟢 Play из idle -> запуск с 0');
          progress.value = 0;
          setTimeout(() => {
            startAnimation();
          }, 10);
          break;
        case 'paused':
          log('🟢 Play из paused -> возобновление');
          resumeAnimation();
          break;
        case 'returning':
          log('🟢 Play во время returning -> waiting_return');
          animationState.value = 'waiting_return';
          break;
      }
    } else {
      // Пауза анимации
      switch (animationState.value) {
        case 'animating':
          log('🔴 Pause во время animating');
          pauseAnimation();
          break;
        case 'waiting_return':
          log('🔴 Pause во время waiting_return -> returning');
          animationState.value = 'returning';
          break;
      }
    }
  }, [isPlaying, featureMode, animationConfig, isInitialized, startAnimation, resumeAnimation, pauseAnimation]);

  // Логирование для отладки (каждые 2 секунды)
  useEffect(() => {
    const interval = setInterval(() => {
      log(`📐 Прогресс: ${progress.value.toFixed(3)}, Углы: X=${rotationX.value.toFixed(2)}°, Y=${rotationY.value.toFixed(2)}°, Z=${rotationZ.value.toFixed(2)}°, Lumen=${lumen.value.toFixed(2)}, состояние=${animationState.value}`);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // ПРОИЗВОДНЫЕ ЗНАЧЕНИЯ ДЛЯ УГЛОВ
  // ============================================================

  // Базовые углы (сырые значения из анимации)
  const rawRotationX = useDerivedValue(() => rotationX.value);
  const rawRotationY = useDerivedValue(() => rotationY.value);
  const rawRotationZ = useDerivedValue(() => rotationZ.value);

  // Флаг isRotateByZ из конфигурации
  const isRotateByZ = useDerivedValue(() => animationConfigRef.current?.isRotateByZ || false);

  // Сдвинутый угол Z (базовый + анимированный начальный угол)
  const shiftedZ = useDerivedValue(() => rawRotationZ.value + animatedStartRotZ.value);

  /**
   * Нормализованный X с учётом поворота Z
   * В режиме manual - просто возвращаем данные с акселерометра
   * В режиме animation - корректируем значение в зависимости от текущего угла Z
   */
  const normRotationX = useDerivedValue(() => {
    // Если режим manual - просто возвращаем данные с акселерометра
    if (featureMode === 'manual') {
      return accelerometerData.value.x;
    }

    // Если не нужно вращать по Z или изображение статично - возвращаем базовое значение
    if (!isRotateByZ.value || isImageStatic.value) {
      return rawRotationX.value;
    }

    // Корректировка X в зависимости от квадранта Z
    let shiftByZ = -animatedStartRotZ.value;
    let rotZ = shiftedZ.value + shiftByZ;
    while (rotZ < 0) rotZ += 360;
    rotZ = rotZ % 360;

    if (rotZ >= 0 && rotZ < 90) {
      return (1 - rotZ / 90) * rawRotationX.value;
    }
    if (rotZ >= 90 && rotZ < 180) {
      return -((rotZ - 90) / 90) * rawRotationX.value;
    }
    if (rotZ >= 180 && rotZ < 270) {
      return -(1 - (rotZ - 180) / 90) * rawRotationX.value;
    }
    if (rotZ >= 270 && rotZ < 360) {
      return ((rotZ - 270) / 90) * rawRotationX.value;
    }
    return rawRotationX.value;
  });

  /**
   * Нормализованный Y с учётом поворота Z
   * В режиме manual - просто возвращаем данные с акселерометра
   * В режиме animation - корректируем значение в зависимости от текущего угла Z
   */
  const normRotationY = useDerivedValue(() => {
    // Если режим manual - просто возвращаем данные с акселерометра
    if (featureMode === 'manual') {
      return accelerometerData.value.y;
    }

    // Если не нужно вращать по Z или изображение статично - возвращаем базовое значение
    if (!isRotateByZ.value || isImageStatic.value) {
      return rawRotationY.value;
    }

    // Корректировка Y в зависимости от квадранта Z
    let shiftByZ = -animatedStartRotZ.value;
    let rotZ = shiftedZ.value + shiftByZ;
    while (rotZ < 0) rotZ += 360;
    rotZ = rotZ % 360;

    // Для Y используем X значение с соответствующим коэффициентом
    if (rotZ >= 0 && rotZ < 90) {
      return -(rotZ / 90) * rawRotationX.value;
    }
    if (rotZ >= 90 && rotZ < 180) {
      return -(1 - (rotZ - 90) / 90) * rawRotationX.value;
    }
    if (rotZ >= 180 && rotZ < 270) {
      return ((rotZ - 180) / 90) * rawRotationX.value;
    }
    if (rotZ >= 270 && rotZ < 360) {
      return (1 - (rotZ - 270) / 90) * rawRotationX.value;
    }
    return rawRotationY.value;
  });

  // В LumenSignLayer.tsx, после объявления normRotationY (примерно строка 385-410)
  const normRotationZ = useDerivedValue(() => {
    // Если режим manual - просто возвращаем данные с акселерометра
    if (featureMode === 'manual') {
      return accelerometerData.value.z;
    }

    // Для animation режима - используем shiftedZ
    return shiftedZ.value;
  });

  /**
   * Запись значений в переданные shared values для родительского слоя и знаков
   * Используется для передачи данных из этого компонента вверх по иерархии
   */
  useDerivedValue(() => {
    if (featureMode === 'animation') {
      // Базовые углы X, Y для родительского слоя (используются для дополнительных трансформаций)
      baseRotationX.value = rawRotationX.value;
      baseRotationY.value = rawRotationY.value;
      // Сдвинутый угол Z для родительского слоя
      shiftedRotationZ.value = shiftedZ.value;

      // Нормализованные углы для знаков (учитывают поворот Z)
      finalRotationX.value = normRotationX.value;
      finalRotationY.value = normRotationY.value;
      finalRotationZ.value = shiftedZ.value;
    } else {
      // В режиме manual все дополнительные углы сбрасываем
      baseRotationX.value = 0;
      baseRotationY.value = 0;
      shiftedRotationZ.value = 0;

      finalRotationX.value = normRotationX.value;
      finalRotationY.value = normRotationY.value;
      finalRotationZ.value = normRotationZ.value;
    }
  });

  // ============================================================
  // СОРТИРОВКА ЗНАКОВ
  // ============================================================
  const inclineSigns = useMemo(() => {
      return signs.filter(sign => sign.sign_show_type === 7 || sign.sign_show_type === 16);
    }, [signs]);

  const backLayerSigns = useMemo(() => {
        return signs.filter(sign => sign.sign_show_type === 3);
      }, [signs]);

  const frontLayerSigns = useMemo(() => {
    return signs.filter(sign => sign.sign_show_type === 4);
  }, [signs]);


  // ============================================================
  // CLEANUP (отмена анимаций при размонтировании)
  // ============================================================
  useEffect(() => {
    // cleanup при размонтировании
    return () => {
      // Останавливаем requestAnimationFrame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Отменяем текущие анимации на всех shared values
      cancelAnimation(rotationX);
      cancelAnimation(rotationY);
      cancelAnimation(rotationZ);
      cancelAnimation(lumen);
      cancelAnimation(baseRotationX);
      cancelAnimation(baseRotationY);
      cancelAnimation(shiftedRotationZ);
      cancelAnimation(finalRotationX);
      cancelAnimation(finalRotationY);
      cancelAnimation(finalRotationZ);

      // Плавно возвращаем все углы в ноль за 300 мс (как при смене знака)
      baseRotationX.value = withTiming(0, { duration: 300 });
      baseRotationY.value = withTiming(0, { duration: 300 });
      shiftedRotationZ.value = withTiming(0, { duration: 300 });
      finalRotationX.value = withTiming(0, { duration: 300 });
      finalRotationY.value = withTiming(0, { duration: 300 });
      finalRotationZ.value = withTiming(0, { duration: 300 });
    };
  }, []);

  // ============================================================
  // РЕНДЕР
  // ============================================================
  return (
    <View
      style={[
        styles.layer,
        {
          width: containerSize.width,
          height: containerSize.height,
        }
      ]}
      pointerEvents="box-none"
    >
      {/* ========== СЛОЙ 0: Знаки под бумагой с наклоном (WatermarkSign) ========== */}
      {inclineSigns.map((sign) => {
        // HMCMode = 7 - знак с оптически переменной краской (HMC)
        if (sign.sign_show_type === 7) {
          return (
            <HmcSign
              key={`hmc-${sign.sign_id}`}
              sign={sign}
              normRotationX={finalRotationX}
              normRotationZ={finalRotationZ}
              featureMode={featureMode}
              compassData={compassData}
              isCompassEnable={isCompassEnable}
              banknoteWidth={banknoteRealSize.width}
              banknoteHeight={banknoteRealSize.height}
            />
          );
        }
        // RotateByXWith2Images = 16 - знак, меняющий изображение при повороте по оси X
        else if (sign.sign_show_type === 16) {
          return (
            <RotateByXWith2ImagesSign
              key={`rotate-${sign.sign_id}`}
              sign={sign}
              normRotationX={finalRotationX}
              normRotationY={finalRotationY}
              normRotationZ={finalRotationZ}
              featureMode={featureMode}
              banknoteWidth={banknoteRealSize.width}
              banknoteHeight={banknoteRealSize.height}
            />
          );
        }
        return null;
      })}

      {/* ========== СЛОЙ 1: Знаки под бумагой (WatermarkSign) ========== */}
      {backLayerSigns.map((sign) => {
        // WatermarkMode = 3 - водяной знак с изменяемой прозрачностью
        if (sign.sign_show_type === 3) {
          return (
            <WatermarkSign
              key={`watermark-${sign.sign_id}`}
              sign={sign}
              lumen={lumen}
              normRotationZ={finalRotationZ}
              featureMode={featureMode}
              banknoteWidth={banknoteRealSize.width}
              banknoteHeight={banknoteRealSize.height}
            />
          );
        }
        return null;
      })}

      {/* ========== СЛОЙ 2: Зеркальное отображение противоположной стороны (самый нижний) ========== */}
      {oppositeSideImage && (
        <MirrorLayer
          oppositeSideImage={oppositeSideImage}
          containerSize={containerSize}
          lumen={lumen}
          normRotationZ={finalRotationZ}
          featureMode={featureMode}
        />
      )}

      {/* ========== СЛОЙ 3: Текстура бумаги ========== */}
      {!modificationPolymer && (
        <PaperTextureLayer
          containerSize={containerSize}
          lumen={lumen}
          normRotationZ={finalRotationZ}
          featureMode={featureMode}
        />
      )}


      {/* ========== СЛОЙ 4: Знаки над бумагой (PerforationSign, HmcSign, RotateByXWith2ImagesSign) ========== */}
      {frontLayerSigns.map((sign) => {
        // PerforationMode = 4 - перфорационный знак
        if (sign.sign_show_type === 4) {
          return (
            <WatermarkSign
              key={`watermark-${sign.sign_id}`}
              sign={sign}
              lumen={lumen}
              normRotationZ={finalRotationZ}
              featureMode={featureMode}
              banknoteWidth={banknoteRealSize.width}
              banknoteHeight={banknoteRealSize.height}
            />
          );
        }
        return null;
      })}
    </View>
  );
}

// ============================================================
// СТИЛИ
// ============================================================
const styles = StyleSheet.create({
  layer: {
    position: 'relative',
    pointerEvents: 'box-none',
  },
});

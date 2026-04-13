import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {
  SharedValue,
  useDerivedValue,
  withTiming,
  cancelAnimation,
  Easing as ReanimatedEasing,
  useSharedValue,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import {Sign} from '@/src';
import {HmcSign} from './HmcSign';
import {KippSign} from './KippSign';
import {OVIKippSign} from "./OVIKippSign";
import {SecurityThread4DSign} from "./SecurityThread4DSign";
import {SecurityThread2DSign} from "./SecurityThread2DSign";
import {SecurityThread2DWithImageSign} from "./SecurityThread2DWithImageSign";
import {SecurityThread1DWithImageSign} from "./SecurityThread1DWithImageSign";
import {OVISign} from "./OVISign";
import {RotateByXWith2ImagesSign} from "./RotateByXWith2ImagesSign";
import {RotateByXYWith4ImagesSign} from "./RotateByXYWith4ImagesSign";
import {SignAnimations} from '@/src/animations/sign/SignAnimations';
import OVMISign from "@/src/components/signs/OVMISign";

//   Model3DMode = 1,
//   Model3DModeLong = 2,
//   WatermarkMode = 3,
//   PerforationMode = 4,
//   LoupeMode = 5,
//   KippMode = 6,
//   HMCMode = 7,
//   OVMI1DMode = 8,
//   OVMI2DMode = 9,
//   SecurityThread2DMode = 10,
//   SecurityThread2DModeWithImage = 11,
//   SecurityThread1DMode = 12,
//   SecurityThread1DModeWithImage = 13,
//   TouchSign = 14,
//   OVIMode = 15,
//   RotateByXWith2Images = 16,
//   RotateByXYWith4Images = 17,
//   OVIKippMode = 18,
//   SecurityThread4DModeWithImage = 19

// Логгер с таймстемпами
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString().slice(11, 23);
  if (data) {
    console.log(`[${timestamp}] 📍 InclineSignLayer: ${message}`, data);
  } else {
    console.log(`[${timestamp}] 📍 InclineSignLayer: ${message}`);
  }
};

interface InclineSignLayerProps {
  signs: Sign[];                       // Все знаки на текущей стороне
  currentSign: Sign | null;            // Текущий выбранный знак (для выбора анимации)
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
  isRotateByZ: boolean;
  maxInput: number;
  duration: number;
};

export default function InclineSignLayer({
                                           signs,
                                           currentSign,
                                           containerSize,
                                           banknoteRealSize,
                                           featureMode = 'animation',
                                           accelerometerData,
                                           compassData,
                                           isCompassEnable,
                                           baseRotationX,
                                           baseRotationY,
                                           shiftedRotationZ,
                                           finalRotationX,
                                           finalRotationY,
                                           finalRotationZ,
                                           isPlaying,
                                           onAnimationComplete,
                                         }: InclineSignLayerProps) {
  // Состояние для отслеживания первой загрузки
  const [isInitialized, setIsInitialized] = useState(false);

  // Shared values для прямого управления углами
  const rotationX = useSharedValue(0);
  const rotationY = useSharedValue(0);
  const rotationZ = useSharedValue(0);

  // Прогресс анимации (0-1)
  const progress = useSharedValue(0);

  const animationState = useSharedValue<AnimationState>('idle');

  // Сохранённые значения на момент паузы
  const pausedProgress = useSharedValue(0);
  const pausedX = useSharedValue(0);
  const pausedY = useSharedValue(0);
  const pausedZ = useSharedValue(0);

  const animatedStartRotZ = useSharedValue(currentSign?.sign_view_rotate_angle || 0);

  const currentSignIdRef = useRef<number | undefined>(currentSign?.sign_id);

  // Данные для worklet'ов (храним в отдельных ref, не в shared values)
  const workletDataRef = useRef<WorkletAnimationData | null>(null);

  // Для JS стороны
  const animationConfigRef = useRef<any>(null);
  const isRotateByZ = useSharedValue<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const isImageStatic = useDerivedValue(() => false);

  // Преобразование конфигурации в сериализуемые данные для worklet'ов
  const prepareWorkletData = (config: any): WorkletAnimationData | null => {
    if (!config) return null;

    return {
      xInput: config.rotations.x.input,
      xOutput: config.rotations.x.output,
      yInput: config.rotations.y.input,
      yOutput: config.rotations.y.output,
      zInput: config.rotations.z.input,
      zOutput: config.rotations.z.output,
      isRotateByZ: config.isRotateByZ || false,
      maxInput: config.rotations.x.input[config.rotations.x.input.length - 1],
      duration: config.duration || 3000
    };
  };

  // Выбор конфигурации анимации
  const animationConfig = useMemo(() => {
    if (!currentSign) {
      animationConfigRef.current = null;
      isRotateByZ.value = false;
      workletDataRef.current = null;
      return null;
    }

    /*switch (CurrentSignShowType)
    {
        case SignShowType.LoupeMode:
            {
                ChangeSignPictureCanvasAnimation("SignInfo Stopped", isImmediately);
                break;
            }

        case SignShowType.HMCMode:
            {
                if (_currentSignType == SignType.InclineSign)
                    ChangeSignPictureCanvasAnimation("SignInfo HMC Demonstration", isImmediately);
                else
                    ChangeSignPictureCanvasAnimation("SignInfo HMC Demonstration by lumen", isImmediately);
                break;
            }


        case SignShowType.OVMI1DMode:
        case SignShowType.OVIMode:
        case SignShowType.SecurityThread1DMode:
        case SignShowType.SecurityThread1DModeWithImage:
            {
                ChangeSignPictureCanvasAnimation("SignInfo RotateX", isImmediately);
                break;
            }

        case SignShowType.RotateByXWith2Images:
            {
                if (_currentSignType == SignType.InclineSign)
                    ChangeSignPictureCanvasAnimation("SignInfo RotateX", isImmediately);
                else
                    ChangeSignPictureCanvasAnimation("SignInfo RotateX by lumen", isImmediately);
                break;
            }

        case SignShowType.KippMode:
            {
                if (_signInfo.sign_view_rotate_angle > 1)
                    ChangeSignPictureCanvasAnimation("SignInfo KippDemonstrationToRight", isImmediately);
                else
                    ChangeSignPictureCanvasAnimation("SignInfo KippDemonstrationToLeft", isImmediately);

                break;
            }
        case SignShowType.OVIKippMode:
            {
                ChangeSignPictureCanvasAnimation("SignInfo OVIKippDemonstration", isImmediately);
                break;
            }

        case SignShowType.SecurityThread2DMode:
        case SignShowType.SecurityThread2DModeWithImage:
        case SignShowType.OVMI2DMode:
            {
                ChangeSignPictureCanvasAnimation("SignInfo RotateXY", isImmediately);
                break;
            }

        case SignShowType.RotateByXYWith4Images:
        case SignShowType.SecurityThread4DModeWithImage:
            {
                ChangeSignPictureCanvasAnimation("SignInfo RotateByRound", isImmediately);
                break;
            }

        case SignShowType.WatermarkMode:
        case SignShowType.PerforationMode:
            {
                ChangeSignPictureCanvasAnimation("SignInfo Lumen", isImmediately);
                break;
            }
        case SignShowType.Model3DModeLong:
            {
                ChangeSignPictureCanvasAnimation("SignInfo RotateXAndMove", isImmediately);
                break;
            }

        case SignShowType.Model3DMode:
            {
                ChangeSignPictureCanvasAnimation("SignInfo RotateX", isImmediately);
                break;
            }

        case SignShowType.TouchSign:
            {
                ChangeSignPictureCanvasAnimationImmediately("SignInfo TouchSignShow");
                break;
            }
    }*/

    let config = null;

    switch (currentSign.sign_show_type) {
      case 7: // HMCMode
        config = SignAnimations.HMCDemonstration;
        break;
      case 8: // OVMI1D
      case 15: // OVIMode
      case 12: // SecurityThread1DMode
      case 13: // SecurityThread1DModeWithImage
      case 16: // RotateByXWith2Images
        config = SignAnimations.RotateX;
        break;
      case 6: // KippMode
        config = currentSign.sign_view_rotate_angle && currentSign.sign_view_rotate_angle > 1
          ? SignAnimations.KippDemonstrationToRight
          : SignAnimations.KippDemonstrationToLeft;
        break;
      case 18: // OVIKippMode
        config = SignAnimations.OVIKippDemonstration;
        break;
      case 10: // SecurityThread2DMode
      case 11: // SecurityThread2DModeWithImage
      case 9: // OVMI2D
        config = SignAnimations.RotateXY;
        break;
      case 17: // RotateByXYWith4Images
      case 19: // SecurityThread4DModeWithImage
        config = SignAnimations.RotateByRound;
        break;
      default:
        config = null;
    }

    animationConfigRef.current = config;
    isRotateByZ.value = config?.isRotateByZ ?? false;
    workletDataRef.current = prepareWorkletData(config);

    if (config?.duration) {
      log(`📊 Длительность анимации установлена: ${config.duration}ms`);
    }
    return config;
  }, [currentSign]);

  // Эффект для плавного обновления animatedStartRotZ при изменении sign_view_rotate_angle
  useEffect(() => {
    const targetAngle = currentSign?.sign_view_rotate_angle || 0;
    animatedStartRotZ.value = withTiming(targetAngle, {duration: 1500});
  }, [currentSign?.sign_view_rotate_angle]);

  // ========== ФУНКЦИИ ДЛЯ ИНТЕРПОЛЯЦИИ УГЛОВ (WORKLET-БЕЗОПАСНЫЕ) ==========

  // Получить угол по прогрессу (использует только переданные данные, без доступа к ref)
  const getAngleAtProgress = useCallback((
    progressValue: number,
    data: WorkletAnimationData,
    axis: 'x' | 'y' | 'z'
  ) => {
    'worklet';

    let input: number[];
    let output: number[];

    if (axis === 'x') {
      input = data.xInput;
      output = data.xOutput;
    } else if (axis === 'y') {
      input = data.yInput;
      output = data.yOutput;
    } else {
      if (!data.isRotateByZ) return 0;
      input = data.zInput;
      output = data.zOutput;
    }

    const normalizedProgress = progressValue * data.maxInput;

    return interpolate(normalizedProgress, input, output);
  }, []);

  // ========== АНИМАЦИЯ ЧЕРЕЗ FRAME CALLBACK ==========

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastTimestampRef.current = null;
  }, []);

  // Функция обновления углов (вызывается из requestAnimationFrame)
  const updateFrame = useCallback((timestamp: number) => {
    const data = workletDataRef.current;
    if (!data) return;

    if (lastTimestampRef.current === null) {
      lastTimestampRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(updateFrame);
      return;
    }

    const delta = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    // Обновляем прогресс на JS стороне
    let newProgress = progress.value + (delta / data.duration);

    if (newProgress >= 1) {
      const remainder = newProgress - 1;
      progress.value = remainder;

      // Обновляем углы через работу с shared values (это безопасно)
      const newX = getAngleAtProgress(progress.value, data, 'x');
      const newY = getAngleAtProgress(progress.value, data, 'y');
      const newZ = data.isRotateByZ ? getAngleAtProgress(progress.value, data, 'z') : 0;

      rotationX.value = newX;
      rotationY.value = newY;
      rotationZ.value = newZ;

      onAnimationComplete();
    } else {
      progress.value = newProgress;

      const newX = getAngleAtProgress(progress.value, data, 'x');
      const newY = getAngleAtProgress(progress.value, data, 'y');
      const newZ = data.isRotateByZ ? getAngleAtProgress(progress.value, data, 'z') : 0;

      rotationX.value = newX;
      rotationY.value = newY;
      rotationZ.value = newZ;
    }

    if (animationState.value === 'animating') {
      animationFrameRef.current = requestAnimationFrame(updateFrame);
    }
  }, [onAnimationComplete, getAngleAtProgress]);

  const startAnimation = useCallback(() => {
    const data = workletDataRef.current;
    if (!data) {
      log('❌ Нет данных для запуска анимации');
      return;
    }

    log(`▶️ Запуск анимации с прогресса: ${progress.value.toFixed(3)}, длительность: ${data.duration}ms`);

    // Обновляем углы сразу
    const newX = getAngleAtProgress(progress.value, data, 'x');
    const newY = getAngleAtProgress(progress.value, data, 'y');
    const newZ = data.isRotateByZ ? getAngleAtProgress(progress.value, data, 'z') : 0;

    rotationX.value = newX;
    rotationY.value = newY;
    rotationZ.value = newZ;

    animationState.value = 'animating';
    lastTimestampRef.current = null;

    animationFrameRef.current = requestAnimationFrame(updateFrame);
  }, [updateFrame, getAngleAtProgress]);

  // Пауза
  const pauseAnimation = useCallback(() => {
    if (animationState.value === 'animating') {
      const currentProgress = progress.value;
      const currentRotX = rotationX.value;
      const currentRotY = rotationY.value;
      const currentRotZ = rotationZ.value;

      log(`⏸️ Пауза: прогресс=${currentProgress.toFixed(3)}, углы X=${currentRotX.toFixed(2)}°, Y=${currentRotY.toFixed(2)}°, Z=${currentRotZ.toFixed(2)}°`);

      pausedProgress.value = currentProgress;
      pausedX.value = currentRotX;
      pausedY.value = currentRotY;
      pausedZ.value = currentRotZ;

      stopAnimation();
      animationState.value = 'paused';
    }
  }, [stopAnimation]);

  // Возобновление
  const resumeAnimation = useCallback(() => {
    if (animationState.value === 'paused') {
      const resumeProgress = pausedProgress.value;
      const resumeX = pausedX.value;
      const resumeY = pausedY.value;
      const resumeZ = pausedZ.value;

      log(`▶️ Возобновление: прогресс=${resumeProgress.toFixed(3)}, углы X=${resumeX.toFixed(2)}°, Y=${resumeY.toFixed(2)}°, Z=${resumeZ.toFixed(2)}°`);

      progress.value = resumeProgress;
      rotationX.value = resumeX;
      rotationY.value = resumeY;
      rotationZ.value = resumeZ;

      startAnimation();
    }
  }, [startAnimation]);

  // Сброс в 0
  const returnToZero = useCallback((shouldStartAfterReturn: boolean = false) => {
    log(`⬅️ Возврат в 0. shouldStartAfterReturn=${shouldStartAfterReturn}`);

    stopAnimation();

    animationState.value = shouldStartAfterReturn ? 'waiting_return' : 'returning';

    progress.value = withTiming(0, {duration: 300}, (finished) => {
      if (finished) {
        if (animationState.value === 'waiting_return' && isPlaying) {
          startAnimation();
        } else if (animationState.value === 'returning') {
          animationState.value = 'idle';
        }
      }
    });

    rotationX.value = withTiming(0, {duration: 300});
    rotationY.value = withTiming(0, {duration: 300});
    rotationZ.value = withTiming(0, {duration: 300});
  }, [isPlaying, startAnimation, stopAnimation]);

  // ========== ОБРАБОТКА СМЕНЫ ЗНАКА ==========
  useEffect(() => {
    if (!isInitialized) {
      rotationX.value = 0;
      rotationY.value = 0;
      rotationZ.value = 0;
      progress.value = 0;
      animationState.value = 'idle';
      setIsInitialized(true);
      currentSignIdRef.current = currentSign?.sign_id;
      return;
    }

    if (currentSignIdRef.current !== currentSign?.sign_id) {
      log(`🔄 Смена знака с ${currentSignIdRef.current} на ${currentSign?.sign_id}`);

      stopAnimation();

      currentSignIdRef.current = currentSign?.sign_id;

      // Сбрасываем в зависимости от состояния
      if (animationState.value === 'animating') {
        returnToZero(false);
      } else if (animationState.value === 'paused') {
        returnToZero(false);
      } else {
        rotationX.value = withTiming(0, {duration: 300});
        rotationY.value = withTiming(0, {duration: 300});
        rotationZ.value = withTiming(0, {duration: 300});
        progress.value = withTiming(0, {duration: 300});
        animationState.value = 'idle';
      }
    }
  }, [currentSign?.sign_id, isInitialized, returnToZero, stopAnimation]);

  // ========== ОБРАБОТКА PLAY/PAUSE ==========
  useEffect(() => {
    if (featureMode !== 'animation' || !animationConfig || !isInitialized) {
      return;
    }

    log(`🎮 Смена isPlaying на ${isPlaying}, текущее состояние: ${animationState.value}`);

    if (isPlaying) {
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

  // Логирование для отладки
  useEffect(() => {
    const interval = setInterval(() => {
      log(`📐 Прогресс: ${progress.value.toFixed(3)}, Углы: X=${rotationX.value.toFixed(2)}°, Y=${rotationY.value.toFixed(2)}°, Z=${rotationZ.value.toFixed(2)}°, состояние=${animationState.value}`);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Базовые углы
  const rawRotationX = useDerivedValue(() => rotationX.value);
  const rawRotationY = useDerivedValue(() => rotationY.value);
  const rawRotationZ = useDerivedValue(() => rotationZ.value);

  // Сдвинутый угол Z (базовый + анимированный начальный угол)
  const shiftedZ = useDerivedValue(() => rawRotationZ.value + animatedStartRotZ.value);

  // Нормализованный X с учётом Z
  const normRotationX = useDerivedValue(() => {
    // Если режим manual - просто возвращаем данные с акселерометра
    if (featureMode === 'manual') {
      return accelerometerData.value.x;
    }

    // Если не нужно вращать по Z или изображение статично - возвращаем базовое значение
    if (!isRotateByZ.value || isImageStatic.value) {
      return rawRotationX.value;
    }

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

  // Нормализованный Y с учётом Z
  const normRotationY = useDerivedValue(() => {
    // Если режим manual - просто возвращаем данные с акселерометра
    if (featureMode === 'manual') {
      return accelerometerData.value.y;
    }

    // Если не нужно вращать по Z или изображение статично - возвращаем базовое значение
    if (!isRotateByZ.value || isImageStatic.value) {
      return rawRotationY.value;
    }

    let shiftByZ = -animatedStartRotZ.value;
    let rotZ = shiftedZ.value + shiftByZ;
    while (rotZ < 0) rotZ += 360;
    rotZ = rotZ % 360;

    // Корректировка Y в зависимости от квадранта Z
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

  // Нормализованный X со сдвигом на 45 градусов для OVIKippSign
  const normRotationX45 = useDerivedValue(() => {
    // Если режим manual - просто возвращаем данные с акселерометра
    if (featureMode === 'manual') {
      return accelerometerData.value.x;
    }

    // Если не нужно вращать по Z или изображение статично - возвращаем базовое значение
    if (!isRotateByZ.value || isImageStatic.value) {
      return rawRotationX.value;
    }

    let shiftByZ = 45;

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

  // Нормализованный Y со сдвигом на 45 градусов для OVIKippSign
  const normRotationY45 = useDerivedValue(() => {
    // Если режим manual - просто возвращаем данные с акселерометра
    if (featureMode === 'manual') {
      return accelerometerData.value.y;
    }

    // Если не нужно вращать по Z или изображение статично - возвращаем базовое значение
    if (!isRotateByZ.value || isImageStatic.value) {
      return rawRotationY.value;
    }

    let shiftByZ = 45;

    let rotZ = shiftedZ.value + shiftByZ;
    while (rotZ < 0) rotZ += 360;

    rotZ = rotZ % 360;

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

  // Запись значений в переданные shared values
  useDerivedValue(() => {
    if (featureMode === 'animation') {
      // Базовые углы X, Y для родительского слоя
      baseRotationX.value = rawRotationX.value;
      baseRotationY.value = rawRotationY.value;
      // Сдвинутый угол Z для родительского слоя
      shiftedRotationZ.value = shiftedZ.value;

      // Нормализованные углы для знаков
      finalRotationX.value = normRotationX.value;
      finalRotationY.value = normRotationY.value;
      finalRotationZ.value = shiftedZ.value;
    } else {
      baseRotationX.value = 0;
      baseRotationY.value = 0;
      shiftedRotationZ.value = 0;

      finalRotationX.value = normRotationX.value;
      finalRotationY.value = normRotationY.value;
      finalRotationZ.value = 0;
    }
  });

  // Сортировка знаков по слоям
  const sortedSigns = useMemo(() => {
    return [...signs].sort((a, b) => {
      const layerA = Math.min(...(a.all_sign_res?.map(res => res.layer || 999) || [999]));
      const layerB = Math.min(...(b.all_sign_res?.map(res => res.layer || 999) || [999]));
      return layerA - layerB;
    });
  }, [signs]);

  useEffect(() => {
    // cleanup при размонтировании
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Отменяем текущие анимации на всех shared values
      cancelAnimation(rotationX);
      cancelAnimation(rotationY);
      cancelAnimation(rotationZ);
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
      {sortedSigns.map((sign) => {
        // KippMode = 6
        if (sign.sign_show_type === 6) {
          return (
            <KippSign
              key={`incline-${sign.sign_id}`}
              sign={sign}
              normRotationX={finalRotationX}
              normRotationY={finalRotationY}
              featureMode={featureMode}
              compassData={compassData}
              isCompassEnable={isCompassEnable}
              banknoteWidth={banknoteRealSize.width}
              banknoteHeight={banknoteRealSize.height}
            />
          );
        }
        // HMCMode = 7
        else if (sign.sign_show_type === 7) {
          return (
            <HmcSign
              key={`incline-${sign.sign_id}`}
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
        // OVIKippMode = 18
        else if (sign.sign_show_type === 18) {
          return (
            <OVIKippSign
              key={`incline-${sign.sign_id}`}
              sign={sign}
              normRotationX={finalRotationX}
              featureMode={featureMode}
              compassData={compassData}
              isCompassEnable={isCompassEnable}
              normRotationX45={normRotationX45}
              normRotationY45={normRotationY45}
              banknoteWidth={banknoteRealSize.width}
              banknoteHeight={banknoteRealSize.height}
            />
          );
        }
        // SecurityThread4DModeWithImage = 19
        else if (sign.sign_show_type === 19) {
          return (
            <SecurityThread4DSign
              key={`incline-${sign.sign_id}`}
              sign={sign}
              normRotationX={finalRotationX}
              normRotationY={finalRotationY}
              banknoteWidth={banknoteRealSize.width}
              banknoteHeight={banknoteRealSize.height}
            />
          );
        }
        // SecurityThread2DMode = 10
        else if (sign.sign_show_type === 10) {
          return (
            <SecurityThread2DSign
              key={`incline-${sign.sign_id}`}
              sign={sign}
              normRotationX={finalRotationX}
              normRotationY={finalRotationY}
              banknoteWidth={banknoteRealSize.width}
              banknoteHeight={banknoteRealSize.height}
            />
          );
        }
        // SecurityThread2DModeWithImage = 11
        else if (sign.sign_show_type === 11) {
          return (
            <SecurityThread2DWithImageSign
              key={`incline-${sign.sign_id}`}
              sign={sign}
              normRotationX={finalRotationX}
              normRotationY={finalRotationY}
              banknoteWidth={banknoteRealSize.width}
              banknoteHeight={banknoteRealSize.height}
            />
          );
        }
        // SecurityThread1DModeWithImage = 13
        else if (sign.sign_show_type === 13) {
          return (
            <SecurityThread1DWithImageSign
              key={`incline-${sign.sign_id}`}
              sign={sign}
              normRotationX={finalRotationX}
              normRotationY={finalRotationY}
              banknoteWidth={banknoteRealSize.width}
              banknoteHeight={banknoteRealSize.height}
            />
          );
        }
        // OVIMode = 15
        else if (sign.sign_show_type === 15) {
          return (
            <OVISign
              key={`incline-${sign.sign_id}`}
              sign={sign}
              normRotationX={finalRotationX}
              normRotationY={finalRotationY}
              banknoteWidth={banknoteRealSize.width}
              banknoteHeight={banknoteRealSize.height}
            />
          );
        }
        // RotateByXWith2Images = 16
        else if (sign.sign_show_type === 16) {
          return (
            <RotateByXWith2ImagesSign
              key={`incline-${sign.sign_id}`}
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
        // RotateByXYWith4Images = 17
        else if (sign.sign_show_type === 17) {
          return (
            <RotateByXYWith4ImagesSign
              key={`incline-${sign.sign_id}`}
              sign={sign}
              normRotationX={finalRotationX}
              normRotationY={finalRotationY}
              banknoteWidth={banknoteRealSize.width}
              banknoteHeight={banknoteRealSize.height}
            />
          );
        }
        // OVMI1DMode = 8
        else if (sign.sign_show_type === 8) {
          return (
            <OVMISign
              key={`incline-${sign.sign_id}`}
              sign={sign}
              normRotationX={finalRotationX}
              normRotationY={finalRotationY}
              banknoteWidth={banknoteRealSize.width}
              banknoteHeight={banknoteRealSize.height}
            />
          );
        }
        // OVMI2DMode = 9
        else if (sign.sign_show_type === 9) {
          return (
            <OVMISign
              key={`incline-${sign.sign_id}`}
              sign={sign}
              normRotationX={finalRotationX}
              normRotationY={finalRotationY}
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

const styles = StyleSheet.create({
  layer: {
    position: 'relative',
    pointerEvents: 'box-none',
  },
});
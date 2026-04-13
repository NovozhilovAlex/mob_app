import {Image, LayoutChangeEvent, PanResponder, StyleSheet, Vibration, View} from "react-native";
import * as React from "react";
import {useEffect, useRef} from "react";
import {Sign} from "@/src";
import {findImageInMap} from "@/src/utils/imageMap";
import MaskedView from "@react-native-masked-view/masked-view";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing, cancelAnimation, runOnJS
} from "react-native-reanimated";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {useImage, SkImage} from "@shopify/react-native-skia";

type AnimationState =
  | 'idle'
  | 'animating'
  | 'paused'
  | 'returning'
  | 'waiting_return';


const inputs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392];
const scales = [0, 0, 0.01, 0.02, 0.03, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.17, 0.2, 0.23, 0.26, 0.29, 0.32, 0.36, 0.4, 0.44, 0.48, 0.52, 0.55, 0.59, 0.62, 0.64, 0.67, 0.71, 0.74, 0.78, 0.81, 0.84, 0.86, 0.89, 0.91, 0.93, 0.95, 0.96, 0.97, 0.98, 0.99, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.99, 0.97, 0.96, 0.94, 0.92, 0.9, 0.89, 0.86, 0.83, 0.8, 0.77, 0.74, 0.71, 0.67, 0.65, 0.59, 0.56, 0.52, 0.5, 0.48, 0.44, 0.39, 0.36, 0.32, 0.28, 0.26, 0.24, 0.21, 0.17, 0.15, 0.13, 0.1, 0.07, 0.06, 0.03, 0.03, 0.01, 0.01, 0, 0];
const fingerPositions = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.01, -0.01, -0.02, -0.03, -0.04, -0.05, -0.07, -0.08, -0.09, -0.1, -0.13, -0.14, -0.16, -0.19, -0.2, -0.22, -0.25, -0.27, -0.31, -0.33, -0.35, -0.38, -0.39, -0.42, -0.44, -0.47, -0.5, -0.52, -0.55, -0.57, -0.61, -0.63, -0.65, -0.68, -0.7, -0.72, -0.75, -0.77, -0.8, -0.82, -0.84, -0.86, -0.88, -0.9, -0.91, -0.91, -0.93, -0.94, -0.96, -0.97, -0.98, -0.99, -0.99, -1, -1, -1, -1, -1, -0.99, -0.99, -0.98, -0.98, -0.97, -0.96, -0.95, -0.93, -0.92, -0.9, -0.88, -0.87, -0.85, -0.83, -0.81, -0.79, -0.76, -0.74, -0.71, -0.69, -0.67, -0.65, -0.62, -0.6, -0.56, -0.52, -0.49, -0.46, -0.45, -0.42, -0.38, -0.35, -0.32, -0.28, -0.25, -0.22, -0.19, -0.16, -0.12, -0.08, -0.05, -0.01, 0.02, 0.05, 0.09, 0.12, 0.15, 0.18, 0.22, 0.25, 0.29, 0.32, 0.35, 0.38, 0.42, 0.45, 0.49, 0.5, 0.53, 0.56, 0.59, 0.62, 0.64, 0.67, 0.7, 0.72, 0.75, 0.77, 0.78, 0.8, 0.83, 0.85, 0.86, 0.88, 0.9, 0.92, 0.93, 0.94, 0.95, 0.97, 0.97, 0.98, 0.99, 0.99, 1, 1, 1, 1, 1, 0.99, 0.99, 0.98, 0.98, 0.97, 0.96, 0.95, 0.94, 0.93, 0.91, 0.9, 0.88, 0.87, 0.85, 0.83, 0.81, 0.79, 0.77, 0.75, 0.73, 0.71, 0.69, 0.67, 0.64, 0.6, 0.57, 0.55, 0.52, 0.49, 0.47, 0.45, 0.42, 0.39, 0.36, 0.33, 0.29, 0.25, 0.23, 0.2, 0.17, 0.13, 0.1, 0.09, 0.06, 0.02, -0.03, -0.06, -0.08, -0.11, -0.14, -0.17, -0.22, -0.24, -0.28, -0.28, -0.32, -0.35, -0.38, -0.41, -0.44, -0.48, -0.51, -0.53, -0.56, -0.59, -0.61, -0.62, -0.65, -0.67, -0.7, -0.73, -0.75, -0.77, -0.79, -0.81, -0.83, -0.85, -0.87, -0.89, -0.9, -0.91, -0.92, -0.94, -0.95, -0.96, -0.97, -0.98, -0.98, -0.99, -0.99, -1, -1, -1, -1, -1, -0.99, -0.99, -0.99, -0.98, -0.97, -0.96, -0.95, -0.94, -0.93, -0.91, -0.9, -0.88, -0.88, -0.86, -0.84, -0.82, -0.8, -0.78, -0.75, -0.73, -0.71, -0.7, -0.68, -0.66, -0.63, -0.6, -0.58, -0.56, -0.53, -0.51, -0.49, -0.48, -0.47, -0.44, -0.41, -0.39, -0.36, -0.34, -0.32, -0.3, -0.28, -0.26, -0.25, -0.21, -0.19, -0.18, -0.16, -0.15, -0.14, -0.12, -0.1, -0.09, -0.07, -0.06, -0.05, -0.04, -0.03, -0.02, -0.01, -0.01, -0.01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const TARGET_VALUE = 392;
const TOTAL_DURATION = (TARGET_VALUE / 60) * 1000;

export function TouchSign(props: {
  sign: Sign,
  banknoteWidth: number,
  banknoteHeight: number,
  featureMode?: 'animation' | 'manual',

  // ДЛЯ УПРАВЛЕНИЯ ВОСПРОИЗВЕДЕНИЕМ
  isPlaying: boolean;                   // Флаг воспроизведения анимации
  onAnimationComplete: () => void;       // Колбэк завершения одного цикла
}) {

  const animationState = useSharedValue<AnimationState>('idle');

  const signRef = useRef<Sign>(props.sign);
  useEffect(() => {
    signRef.current = props.sign;
  }, [props.sign]);

  const featureModeRef = useRef<'animation' | 'manual'>(props.featureMode);
  useEffect(() => {
    featureModeRef.current = props.featureMode;
  }, [props.featureMode]);

  const {nightMode} = useAppSettingsStore();

  const progress = useSharedValue(0);


  //
  const sizeAnimatedStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(
      progress.value,
      inputs,
      scales
    );

    const sizePercent = scaleValue * 100;
    const marginPercent = (1 - scaleValue) * 50;

    const opacityValue = interpolate(
      progress.value,
      [0, 20, 372, 392],
      [0,  1,   1,   0]
    );

    if (props.featureMode === 'animation') {
      return {
        width: `${sizePercent}%`,
        height: `${sizePercent}%`,
        marginLeft: `${marginPercent}%`,
        marginTop: `${marginPercent}%`,
        opacity: opacityValue
      };
    }
    else
    {
      return {
        width: `100%`,
        height: `100%`,
        marginLeft: `0%`,
        marginTop: `0%`,
        opacity: 1
      };
    }

  }, [props.featureMode]);


  const reverseSizeAnimatedStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(
      progress.value,
      inputs,
      scales
    );


    const reverse = scaleValue > 0 ? 1 / scaleValue : 100;


    const sizePercent = reverse * 100;
    const marginPercent = (1 - reverse) * 50;

    if (props.featureMode === 'animation') {
      return {
        width: `${sizePercent}%`,
        height: `${sizePercent}%`,
        marginLeft: `${marginPercent}%`,
        marginTop: `${marginPercent}%`,
      };
    }
    else
    {
      return {
        width: `100%`,
        height: `100%`,
        marginLeft: `0%`,
        marginTop: `0%`,
      };
    }

  }, [props.featureMode]);

  const handAnimatedStyle = useAnimatedStyle(() => {
    const len = 30;

    // -1 --- 0 --- 1
    const fingerPositionValue = interpolate(
      progress.value,
      inputs,
      fingerPositions
    );

    // 50-len --- 50 --- 50+len
    const position = fingerPositionValue * len + 50;

    if ((signRef.current.sign_max_x ?? 0) - (signRef.current.sign_min_x ?? 0) >
        (signRef.current.sign_max_y ?? 0) - (signRef.current.sign_min_y ?? 0))
    {
      return {
        marginLeft: '50%',
        marginTop: `${position}%`
      };
    }
    else
    {
      return {
        marginLeft: `${position}%`,
        marginTop: '50%'
      };
    }
  });



  const touchAreaSizeRef = useRef({ width: 0, height: 0 });
  const touchAreaStartRef = useRef({ x: 0, y: 0 });

  const onTouchAreaLayout = (event: LayoutChangeEvent) => {
    console.log('onTouchAreaLayout', event);

    touchAreaSizeRef.current = {width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height};
    // event.target.measure((x, y, width, height, pageX, pageY) => {
    //   console.log('onTouchAreaLayout event.target.measure', pageX, pageY, width, height);
    //   touchAreaBoxRef.current = { x: pageX, y: pageY, width: width, height: height };
    // });
  };

  const vibrateStartTime = useSharedValue(0);

  const startVibration = () => {
    const duration = 400;
    const restartDuration = 300;
    const now = Date.now();
    if (now - vibrateStartTime.value < restartDuration)
    {
      console.log('Vibration.vibrate skip');
      return;
    }

    console.log('Vibration.vibrate start');
    vibrateStartTime.value = now;
    Vibration.vibrate(duration);
  };

  const stopVibration = () => {
    console.log('Vibration.cancel');

    vibrateStartTime.value = 0;
    Vibration.cancel();
  };

  function startAnimation() {
    console.log('startAnimation');
    progress.value = withRepeat(
      withTiming(TARGET_VALUE, {
          duration: TOTAL_DURATION,
          easing: Easing.linear,
        },
        (finished) => {
          if (finished) {
            onAnimationComplete();
          }
        }),
      1,
      false
    );
    animationState.value = 'animating';
  }

  function resumeAnimation() {
    console.log('resumeAnimation');
    const remainingDistance = TARGET_VALUE - progress.value;
    const remainingDuration = (remainingDistance / TARGET_VALUE) * TOTAL_DURATION;

    progress.value = withRepeat(
      withTiming(TARGET_VALUE, {
        duration: remainingDuration,
        easing: Easing.linear,
      },
        (finished) => {
          if (finished) {
            onAnimationComplete();
          }
        }),
      1,
      false
    );
    animationState.value = 'animating';
  }

  function pauseAnimation() {
    animationState.value = 'paused';

    cancelAnimation(progress);
  }

  function onAnimationComplete() {
    'worklet';
    console.log('onAnimationComplete');
    animationState.value = 'idle';
    runOnJS(props.onAnimationComplete)();
  }

  // ============================================================
  // ОБРАБОТКА PLAY/PAUSE
  // ============================================================
  useEffect(() => {
    // Игнорируем, если не animation режим, нет конфигурации или не инициализированы
    if (props.featureMode !== 'animation') {
      return;
    }

    console.log(`🎮 Смена isPlaying на ${props.isPlaying}, текущее состояние: ${animationState.value}`);

    if (props.isPlaying) {
      // Запуск анимации
      switch (animationState.value) {
        case 'idle':
          console.log('🟢 Play из idle -> запуск с 0');
          progress.value = 0;
          setTimeout(() => {
            startAnimation();
          }, 10);
          break;
        case 'paused':
          console.log('🟢 Play из paused -> возобновление');
          resumeAnimation();
          break;
        case 'returning':
          console.log('🟢 Play во время returning -> waiting_return');
          animationState.value = 'waiting_return';
          break;
      }
    } else {
      // Пауза анимации
      switch (animationState.value) {
        case 'animating':
          console.log('🔴 Pause во время animating');
          pauseAnimation();
          break;
        case 'waiting_return':
          console.log('🔴 Pause во время waiting_return -> returning');
          animationState.value = 'returning';
          break;
      }
    }
  }, [props.isPlaying, props.featureMode]);


  // ==================== PAN RESPONDER ДЛЯ ОБРАБОТКИ ЖЕСТОВ ====================
  const panResponder = useRef(
    PanResponder.create({
      // 1. Может ли компонент начать обработку жеста?
      onStartShouldSetPanResponder: () => {
        //console.log('panResponder onStartShouldSetPanResponder');
        // Разрешаем обработку жестов только если есть текущий знак и режим manual
        return featureModeRef.current === 'manual' && signRef.current !== null;
      },

      // 2. Может ли компонент обработать движение?
      onMoveShouldSetPanResponder: () => {
        //console.log('panResponder onMoveShouldSetPanResponder');
        // Разрешаем обработку жестов только если есть текущий знак и режим manual
        return featureModeRef.current === 'manual' && signRef.current !== null;
      },

      // 3. Жест начался (палец коснулся экрана)
      onPanResponderGrant: (evt) => {
        console.log('panResponder onPanResponderGrant',
          evt.nativeEvent.locationX, evt.nativeEvent.locationY
        );

        touchAreaStartRef.current = {x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY};
      },

      // 4. Палец движется
      onPanResponderMove: (evt, gestureState) => {
        const currentX = touchAreaStartRef.current.x + gestureState.dx;
        const currentY = touchAreaStartRef.current.y + gestureState.dy;

        const currentXCf = currentX / touchAreaSizeRef.current.width;
        const currentYCf = currentY / touchAreaSizeRef.current.height;

        const pixel = getPixelColor(currentXCf, currentYCf);

        if (pixel &&
           (pixel.r + pixel.g + pixel.b) / 3 > 128){
          startVibration();
        }
        else
        {
          stopVibration();
        }
        console.log('onPanResponderMove: ', currentXCf, currentYCf, pixel);
      },


      // 5. Жест завершен (палец отпущен)
      onPanResponderRelease: (evt, gestureState) => {
        console.log('panResponder onPanResponderRelease', gestureState);
      },

      // 6. Жест отменен (например, системой)
      onPanResponderTerminate: (evt, gestureState) => {
        console.log('panResponder onPanResponderTerminate', gestureState);
      },
    })
  ).current;

  const skiaImage = useImage(findImageInMap(signRef.current?.sign_res2_data?.res_path!));
  const imageSV = useSharedValue<SkImage | null>(null);
  useEffect(() => {
    if (skiaImage) {
      imageSV.set(skiaImage);
    }
  }, [skiaImage]);
  //const image = useSharedValue(useImage(findImageInMap(signRef.current?.sign_res2_data?.res_path!)));

  const getPixelColor = (xCf:number, yCf:number) => {
    if (!imageSV.value){
      console.log('getPixelColor image null');
      return;
    }

    const x = imageSV.value.width() * xCf;
    const y = imageSV.value.height() * yCf;
    // Читаем область 1x1 пиксель в указанных координатах
    const pixelData = imageSV.value.readPixels(x, y, {
      width: 1,
      height: 1,
      alphaType: 1,
      colorType: 4,
    });

    if (pixelData) {
      const [r, g, b, a] = pixelData;
      return { r, g, b, a };
    }
  };



  if (!signRef.current || !signRef.current?.sign_res1_data || !signRef.current?.sign_res2_data) {
    return null;
  }


  const pivotX = signRef.current?.sign_res1_data?.pivot_x!;
  const pivotY = signRef.current?.sign_res1_data?.pivot_y!;

  const scale = signRef.current?.sign_scale_value!;

  const imageWidth = 350 / scale;
  const imageHeight = 350 / scale;

  const imageWidthPercent = (imageWidth / props.banknoteWidth) * 100;
  const imageHeightPercent = (imageHeight / props.banknoteHeight) * 100;

  const left = pivotX * 100 - imageWidthPercent / 2;
  const top = (1 - pivotY) * 100 - imageHeightPercent / 2;
  const right = 100 - left - imageWidthPercent;
  const bottom = 100 - top - imageHeightPercent;
  const bnkVerticalCf = props.banknoteHeight / props.banknoteWidth;

  const touchImage = findImageInMap(signRef.current?.sign_res1_data?.res_path);
  const cropMaskImage = signRef.current?.sign_res3_data
    ? findImageInMap(signRef.current?.sign_res3_data?.res_path)
    : null;

  const handImage = require('@/assets/Image/Resources/Icon/icon-hand2.png');





  //console.log("Touch init", signRef.current);

  return (
    <View style={[styles.absoluteLayout]}>

      <Animated.View style={{position:'absolute',
        width:`${imageWidthPercent}%`,
        height:`${imageHeightPercent}%`,
        marginLeft:`${left}%`,
        marginTop:`${top * bnkVerticalCf}%`,
        marginBottom:`${bottom * bnkVerticalCf}%`,
        marginRight:`${right * bnkVerticalCf}%`
      }}>
        <Animated.View style={[{position:'absolute'}, sizeAnimatedStyle]}>
          <View  style={[{
              backgroundColor:'black',
              margin:0,
              borderRadius:'50%',
              flex:1}]} />
        </Animated.View>
        <Animated.View style={[sizeAnimatedStyle]}>
          <MaskedView style={{position:'absolute', width:'100%', height:'100%'}}
                      maskElement={
                        <View style={[{position:'absolute',
                          borderRadius:'50%'}, {
                          width: `96%`,
                          height: `96%`,
                          margin: `2%`
                        }]}>
                          <View  style={[{
                            backgroundColor:'black',
                            borderRadius:'50%',
                            flex:1}]} />
                        </View>}>

            <Animated.View style={[{position:'absolute'}, reverseSizeAnimatedStyle]}>
              <Image source={touchImage}
                     style={{position:'absolute', width:'100%', height:'100%'}}/>

              <Image source={cropMaskImage}
                     tintColor={nightMode ? '#235162' : '#478D9C'}
                     style={{position:'absolute', width:'100%', height:'100%'}}/>
            </Animated.View>
          </MaskedView>
        </Animated.View>



        {props.featureMode === 'animation' && (
          <Animated.View style={[{position:'absolute'}, sizeAnimatedStyle]}>
            <View  style={{width:'100%', height:'100%'}}>
              <Animated.View style={[{width:'44%', height:'44%'}, handAnimatedStyle]}>
                <Image style={{width:'100%', height:'100%', marginLeft:'-43.5%', marginTop:'-8.5%'}}
                       source={handImage}/>
              </Animated.View>

            </View>
          </Animated.View>
        )}


        <View onLayout={onTouchAreaLayout}
              style={{position:'absolute', width:'100%', height:'100%'}}
              {...panResponder.panHandlers}/>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteLayout: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
});
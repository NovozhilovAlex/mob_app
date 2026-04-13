import {Image, PanResponder, StyleSheet, View} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import * as React from "react";
import {useEffect, useMemo, useRef, useState} from "react";
import {Sign} from "@/src";
import {SignImageOnBanknote} from "@/src/components/SignImageOnBanknote";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming, Easing
} from "react-native-reanimated";

type AnimationState =
  | 'idle'
  | 'animating'
  | 'paused'
  | 'returning'
  | 'waiting_return';

const TARGET_VALUE = 2;
const TOTAL_DURATION = 15 * 1000;

export function LoupeSign(props: {
  currentSign: Sign | null,
  signs: Sign[],
  banknoteImage: any,
  banknoteWidth: number,
  banknoteHeight: number,
  featureMode?: 'animation' | 'manual';

  // ДЛЯ УПРАВЛЕНИЯ ВОСПРОИЗВЕДЕНИЕМ
  isPlaying: boolean;                   // Флаг воспроизведения анимации
  onAnimationComplete: () => void;       // Колбэк завершения одного цикла
}) {

  const animationState = useSharedValue<AnimationState>('idle');

  const signMinX = props.currentSign?.sign_min_x ?? 0;
  const signMinY = props.currentSign?.sign_min_y ?? 0;
  const signMaxX = props.currentSign?.sign_max_x ?? 0;
  const signMaxY = props.currentSign?.sign_max_y ?? 0;

  const progress = useSharedValue(0);
  const manualPosition = useSharedValue({ x: 0, y:0 });

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

  function startAnimation() {
    console.log('start animation')
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
      1, // -1 для бесконечного повтора
      false
    );

    animationState.value = 'animating';
  }

  function pauseAnimation() {
    animationState.value = 'paused';

    cancelAnimation(progress);
  }

  function stopAnimation() {
    animationState.value = 'idle';
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
      if (animationState.value === 'animating'){
        stopAnimation();
        let {xPercent, yPercent} = calculatePositions(progress.value);
        manualPosition.value = {
          x: xPercent,
          y: yPercent
        };
      }
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

  const signRef = useRef<Sign | null>(props.currentSign);
  useEffect(() => {
    signRef.current = props.currentSign;
  }, [props.currentSign]);

  const featureModeRef = useRef<'animation' | 'manual'>(props.featureMode);
  useEffect(() => {
    featureModeRef.current = props.featureMode;
  }, [props.featureMode]);

  const randomStart = useMemo(() => ({
    x: Math.random() * 2,
    y: Math.random() * 2,
  }), []);

  function CalcPercentX(val: number) {
    return -((0.5 - val) * 100);
  }

  function CalcPercentY(val: number) {
    return ((0.5 - val) * 100);
  }

  const resources = props.signs.filter(s =>
    s.sign_res1_data != null
  ).map((s:Sign) => { return s.sign_res1_data; });


  let loupeTranslateXStart = 0;
  let loupeTranslateYStart = 0;

  useEffect(()=> {
    if (props.featureMode !== 'manual' &&
        props.currentSign)
      return;

    const signMinXLocal = props.currentSign?.sign_min_x ?? 0;
    const signMinYLocal = props.currentSign?.sign_min_y ?? 0;
    const signMaxXLocal = props.currentSign?.sign_max_x ?? 0;
    const signMaxYLocal = props.currentSign?.sign_max_y ?? 0;

    let xValue = signMinYLocal + (signMaxYLocal - signMinYLocal) * 0.5;
    let yValue = signMinXLocal + (signMaxXLocal - signMinXLocal) * 0.5;

    let xPercent = -((0.5 - xValue) * 100);
    let yPercent = ((0.5 - yValue) * 100);

    manualPosition.value = {
      x: xPercent,
      y: yPercent
    };

    console.log('on new currentSign:', props.currentSign);
  }, [props.currentSign])


  // ==================== PAN RESPONDER ДЛЯ ОБРАБОТКИ ЖЕСТОВ ====================
  const panResponder = useRef(
    PanResponder.create({
      // 1. Может ли компонент начать обработку жеста?
      onStartShouldSetPanResponder: () => {
        console.log('panResponder onStartShouldSetPanResponder');
        // Разрешаем обработку жестов только если есть текущий знак и режим manual
        return featureModeRef.current === 'manual' && signRef.current !== null;
      },

      // 2. Может ли компонент обработать движение?
      onMoveShouldSetPanResponder: () => {
        console.log('panResponder onMoveShouldSetPanResponder');
        // Разрешаем обработку жестов только если есть текущий знак и режим manual
        return featureModeRef.current === 'manual' && signRef.current !== null;
      },

      // 3. Жест начался (палец коснулся экрана)
      onPanResponderGrant: (evt) => {
       const startX = manualPosition.value.x;
       const startY = manualPosition.value.y;

        console.log('panResponder onPanResponderGrant',
          'current X:', startX,
          'current Y:', startY,
          'sign exists:', signRef.current !== null
        );

        loupeTranslateXStart = startX;
        loupeTranslateYStart = startY;
      },

      // 4. Палец движется
      onPanResponderMove: (evt, gestureState) => {
        // Проверяем, что есть текущий знак
        if (!signRef.current) {
          console.log('panResponderMove: no current sign, ignoring');
          return;
        }

        let dx = gestureState.dx;
        let dy = gestureState.dy;

        let w = props.banknoteWidth;
        let h = props.banknoteHeight;

        let dPercentX = dx * 100 / w;
        let dPercentY = dy * 100 / h;

        let newPercentX = loupeTranslateXStart + dPercentX;
        let newPercentY = loupeTranslateYStart + dPercentY;

        console.log('panResponderMove', {
          dx, dy,
          dPercentX, dPercentY,
          newPercentX, newPercentY
        });

        manualPosition.value = {
          x: normManualPositionX(newPercentX),
          y: normManualPositionY(newPercentY),
        };
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

  function normManualPositionX(value:number) {
    // Проверяем, что signRef.current существует перед использованием
    if (!signRef.current) {
      return value;
    }

    const signMinXPercent = CalcPercentX(signRef.current.sign_min_y!);
    const signMaxXPercent = CalcPercentX(signRef.current.sign_max_y!);

    if (value < signMinXPercent)
      value = signMinXPercent;
    if (value > signMaxXPercent)
      value = signMaxXPercent;

    return value;
  }

  function normManualPositionY(value:number){
    // Проверяем, что signRef.current существует перед использованием
    if (!signRef.current) {
      return value;
    }

    const signMinYPercent = CalcPercentY(signRef.current.sign_max_x!);
    const signMaxYPercent = CalcPercentY(signRef.current.sign_min_x!);

    if (value < signMinYPercent)
      value = signMinYPercent;
    if (value > signMaxYPercent)
      value = signMaxYPercent;

    return value;
  }

  const calculatePosition = (val: number) => {
    'worklet';
    // Используем модуль 2, так как цикл движения "туда-обратно" равен 2
    const t = (val) % 2;
    return Math.abs(t - 1);
  };

  function calculatePositions(progressValue: number) {
    'worklet';
    const posX = calculatePosition(progressValue + randomStart.x);
    const posY = calculatePosition(progressValue + randomStart.y);

    let xValue = signMinY + (signMaxY - signMinY) * posY;
    let yValue = signMinX + (signMaxX - signMinX) * posX;

    let xPercent = -((0.5 - xValue) * 100);
    let yPercent = ((0.5 - yValue) * 100);
    return {xPercent, yPercent};
  }

  const animatedStyleLoupe = useAnimatedStyle(() => {
    let translateX = 0;
    let translateY = 0;

    if (props.featureMode === 'animation'){
      let {xPercent, yPercent} = calculatePositions(progress.value);
      translateX = xPercent;
      translateY = yPercent;
    }
    else {
      translateX = manualPosition.value.x;
      translateY = manualPosition.value.y;
    }

    return {
      transform: [
        {translateX: `${translateX}%`},
        {translateY: `${translateY}%`},
      ],
    };

  });



  const animatedStyleScaledImage = useAnimatedStyle(() => {
    let translateX = 0;
    let translateY = 0;

    if (props.featureMode === 'animation'){
      let {xPercent, yPercent} = calculatePositions(progress.value);
      translateX = xPercent;
      translateY = yPercent;
    }
    else {
      translateX = manualPosition.value.x;
      translateY = manualPosition.value.y;
    }

    return {
      transform: [
        {translateX: `${-translateX}%`},
        {translateY: `${-translateY}%`},
      ],
    };

  });

  return (
    <Animated.View style={[styles.absoluteLayout
     ,{ opacity: props.currentSign ? 1 : 0 }
    ]}>
      <Animated.View style={[
        animatedStyleLoupe,
        {
          width: "100%", height: "100%",
          justifyContent: "center", alignItems: "center",
        }]}>
        <View style={{
          width: 200, height: 200,
          justifyContent: "center",
          alignItems: "center"
        }}>
          <View style={styles.container}>
            <MaskedView
              style={styles.maskedView}
              maskElement={
                // Все, что прозрачно в этом элементе — скроет изображение
                <View style={styles.maskContainer}>
                  <View style={styles.circle}/>
                </View>
              }
            >
              {/* Контент, который будет обрезан маской */}
              <Animated.View style={[
                animatedStyleScaledImage,
                {
                  width: props.banknoteWidth * 2,
                  height: props.banknoteHeight * 2,
                  backgroundColor: "orange",
                  justifyContent: "center",
                  alignItems: "center",
                }]}
              >
                <View style={styles.absoluteLayout}>
                  <Image source={props.banknoteImage}
                         style={{width: "100%", height: "100%"}}/>
                </View>

                {resources.map((res) => (
                  <SignImageOnBanknote key={res!.sign_res_id}
                                       signRes={res!}
                                       banknoteWidth={props.banknoteWidth}
                                       banknoteHeight={props.banknoteHeight}/>
                ))}
              </Animated.View>
            </MaskedView>

            <View style={[styles.absoluteLayout]}>
              <View
                style={[styles.circle, {
                  backgroundColor: 'transparent',
                  boxShadow: [{
                    offsetX: 0,
                    offsetY: 0,
                    blurRadius: 15,
                    spreadDistance: 1,
                    color: 'rgba(0, 0, 0, 0.8)',
                  }]
                }]}
                {...panResponder.panHandlers}
              />
            </View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  maskedView: { width: 200, height: 200, justifyContent: 'center', alignItems: 'center' },
  maskContainer: {
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  absoluteLayout: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'black',
  },
});
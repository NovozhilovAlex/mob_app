import { StyleSheet, View } from "react-native";
import * as React from "react";
import { useEffect, useRef } from "react";
import { Sign } from "@/src";
import { SignImageOnBanknote } from "@/src/components/SignImageOnBanknote";
import { SharedValue, useAnimatedStyle } from "react-native-reanimated";

export function HmcSign(props: {
  sign: Sign,
  normRotationX: SharedValue<number>,
  normRotationZ: SharedValue<number>,
  featureMode?: 'animation' | 'manual',
  compassData: SharedValue<number>;
  isCompassEnable: SharedValue<boolean>;
  banknoteWidth: number,
  banknoteHeight: number
}) {
  const maxAngle = 50;
  const signRef = useRef<Sign>(props.sign);

  useEffect(() => {
    signRef.current = props.sign;
  }, [props.sign]);

  const trasformLumenHMCInDynamicMode = (z: number): {topAComp: number, bottomAComp: number} => {
    'worklet';

    let topAComp = 0;
    let bottomAComp = 0;

    if (z > 0 && z < 0.4) {
      topAComp = Math.abs(z) / 0.4;
    }

    if (z >= 0.4 && z <= 0.6) {
      topAComp = 1.0;
    }

    if (z > 0.6 && z < 0.9) {
      topAComp = Math.abs(-z + 0.9) / 0.3;
      bottomAComp = Math.abs(z - 0.6) / 0.3;
    }

    if (z >= 0.9) {
      bottomAComp = 1.0;
    }

    // Логика HelpsController.IsActionHappen (если нужно прокинуть событие наверх)
    if (topAComp > 0.5 || bottomAComp > 0.5) {
      // Вызов колбэка или установка стейта
    }

    return { topAComp, bottomAComp };
  };

  const getPos1RotatedValue = (angle: number, delta: number): number => {
    'worklet';

    let pos1Value: number | null = null;

    // Проверка основного диапазона
    if (angle > -delta && angle < delta) {
      pos1Value = angle;
    }
    // Проверка диапазона со смещением -360
    else if (angle > -delta - 360 && angle < delta - 360) {
      pos1Value = angle + 360;
    }
    // Проверка диапазона со смещением +360
    else if (angle > -delta + 360 && angle < delta + 360) {
      pos1Value = angle - 360;
    }

    // Если ни одно условие не подошло (аналог float.IsNaN)
    if (pos1Value === null) {
      return 0;
    }

    // Расчет относительного значения и инверсия
    let result = 1 - Math.abs(pos1Value) / delta;

    // Ограничение в пределах [0, 1]
    return Math.max(0, Math.min(1, result));
  };

  const getPos2RotatedValue = (angle: number, delta: number): number => {
    'worklet';

    let pos2Value: number | null = null;

    // Основной диапазон вокруг 180
    if (angle > -delta + 180 && angle < delta + 180) {
      pos2Value = angle - 180;
    }
    // Смещение -360 от 180 (-180)
    else if (angle > -delta + 180 - 360 && angle < delta + 180 - 360) {
      pos2Value = angle - 180 + 360;
    }
    // Смещение +360 от 180 (540)
    else if (angle > -delta + 180 + 360 && angle < delta + 180 + 360) {
      pos2Value = angle - 180 - 360;
    }
    // Еще одно смещение (эквивалент -540)
    else if (angle > -delta - 180 - 360 && angle < delta - 180 - 360) {
      pos2Value = angle + 180 + 360;
    }

    if (pos2Value === null) {
      return 0;
    }

    // Расчет интенсивности и ограничение [0, 1]
    const result = 1 - Math.abs(pos2Value) / delta;
    return Math.max(0, Math.min(1, result));
  };

  const trasformHMCInDynamicByCompassMode = (
    normRotationX: number,
    compassValue: number
  ): {topAComp: number, bottomAComp: number} => {
    'worklet';

    // Ограничение (Clamping) угла от 0 до 60
    const clampedRotationX = Math.max(0, Math.min(60, normRotationX));
    const angleValueCf = clampedRotationX / 60.0;

    const delta = 40.0;

    // Расчет коэффициентов на основе компаса
    const botCf = getPos1RotatedValue(compassValue, delta);
    const topCf = getPos2RotatedValue(compassValue, delta);

    // Итоговые значения прозрачности (умножение на 2.0 по логике оригинала)
    let bottomAComp = (botCf * angleValueCf) * 2.0;
    let topAComp = (topCf * angleValueCf) * 2.0;

    // Ограничение сверху (Cap at 1.0)
    bottomAComp = Math.min(1.0, bottomAComp);
    topAComp = Math.min(1.0, topAComp);

    // Триггер для контроллера подсказок
    if (bottomAComp > 0.5 || topAComp > 0.5) {
      // HelpsController.IsActionHappen = true;
    }

    return { topAComp, bottomAComp };
  };

  const animatedStyleForRes1 = useAnimatedStyle(() => {
    let aCompMuarTop = 0;
    const isLumen = signRef.current.sign_type?.sign_type_code === 'lumen';

    if (props.featureMode === 'animation' ||
        (!isLumen &&
         !props.isCompassEnable.value )) {
      aCompMuarTop = props.normRotationX.value >= 0
        ? 0
        : Math.abs(props.normRotationX.value / maxAngle);
    }
    else{
      if (isLumen) {
        const cfs = trasformLumenHMCInDynamicMode(props.normRotationZ.value);
        aCompMuarTop = cfs.topAComp;
      }
      else {
        // Compass
        const cfs = trasformHMCInDynamicByCompassMode(props.normRotationX.value, props.compassData.value);
        aCompMuarTop = cfs.topAComp;
      }
    }
    return { opacity: aCompMuarTop };
  });

  const animatedStyleForRes2 = useAnimatedStyle(() => {
    let aCompMuarBottom = 0;
    const isLumen = signRef.current.sign_type?.sign_type_code === 'lumen';

    if (props.featureMode === 'animation' ||
      (!isLumen &&
        !props.isCompassEnable.value )) {
      aCompMuarBottom = props.normRotationX.value <= 0
        ? 0
        : Math.abs(props.normRotationX.value / maxAngle);
    }
    else{
      if (isLumen) {
        const cfs = trasformLumenHMCInDynamicMode(props.normRotationZ.value);
        aCompMuarBottom = cfs.bottomAComp;
      }
      else {
        // Compass
        const cfs = trasformHMCInDynamicByCompassMode(props.normRotationX.value, props.compassData.value);
        aCompMuarBottom = cfs.bottomAComp;
      }
    }
    return { opacity: aCompMuarBottom };
  });

  if (!signRef.current?.sign_res1_data || !signRef.current?.sign_res2_data) {
    return null;
  }

  console.log("HmcSign init", signRef.current);

  return (
    <View style={styles.absoluteLayout}>

      <SignImageOnBanknote
        style={animatedStyleForRes1}
        signRes={signRef.current.sign_res1_data}
        banknoteWidth={props.banknoteWidth}
        banknoteHeight={props.banknoteHeight}
      />

      <SignImageOnBanknote
        style={animatedStyleForRes2}
        signRes={signRef.current.sign_res2_data}
        banknoteWidth={props.banknoteWidth}
        banknoteHeight={props.banknoteHeight}
      />
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
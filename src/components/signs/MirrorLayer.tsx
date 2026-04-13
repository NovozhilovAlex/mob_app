import { StyleSheet, Image } from "react-native";
import * as React from "react";
import { useRef } from "react";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const SMOOTHING_FACTOR = 0.2; // Коэффициент сглаживания для manual режима

interface MirrorLayerProps {
  oppositeSideImage: any;              // Изображение противоположной стороны
  containerSize: {
    width: number;
    height: number;
  };
  lumen?: SharedValue<number>;         // Для animation режима
  normRotationZ?: SharedValue<number>; // Для manual режима (акселерометр Z)
  featureMode: 'animation' | 'manual';
}

export function MirrorLayer({
                              oppositeSideImage,
                              containerSize,
                              lumen,
                              normRotationZ,
                              featureMode,
                            }: MirrorLayerProps) {
  const previousOpacity = useRef(0); // Для сглаживания в manual режиме

  /**
   * Анимированный стиль для MirrorLayer
   * В animation режиме - зеркальный слой не виден
   * В manual режиме - вычисляем opacity на основе normRotationZ (акселерометр Z)
   */
  const animatedStyle = useAnimatedStyle(() => {
    let finalOpacity = 0;

    if (featureMode === 'animation') {
      // Animation режим: используем lumen
      const lumenValue = lumen?.value ?? 0;
      finalOpacity = lumenValue * 0.15; // Зеркальный слой имеет 0.15 интенсивности
    } else {
      // Manual режим: вычисляем opacity из normRotationZ
      const zValue = normRotationZ?.value ?? 0;

      // Только положительные значения
      let rawOpacity = zValue > 0 ? Math.abs(zValue) : 0;

      // Множитель 3, ограничение до 1
      rawOpacity = Math.min(rawOpacity * 3, 1);

      // Сглаживание
      const smoothedOpacity = previousOpacity.current * (1 - SMOOTHING_FACTOR) + rawOpacity * SMOOTHING_FACTOR;
      previousOpacity.current = smoothedOpacity;

      // Зеркальный слой имеет 0.15 интенсивности
      finalOpacity = smoothedOpacity * 0.15;
    }

    // Плавная анимация прозрачности
    return { opacity: withTiming(finalOpacity, { duration: 50 }) };
  });

  return (
    <Animated.View
      style={[
        styles.mirrorLayer,
        animatedStyle,
        {
          width: containerSize.width,
          height: containerSize.height,
        }
      ]}
      pointerEvents="none"
    >
      <Image
        source={oppositeSideImage}
        style={[
          styles.mirrorImage,
          {
            width: containerSize.width,
            height: containerSize.height,
            transform: [{ scaleX: -1 }], // Отражение по горизонтали
          }
        ]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mirrorLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  mirrorImage: {
    position: 'absolute',
  },
});

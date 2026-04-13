import { StyleSheet, Image } from "react-native";
import * as React from "react";
import { useRef } from "react";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

// Константа для текстуры бумаги
const PAPER_TEXTURE = require('@/assets/Image/Bumaga.png');
const SMOOTHING_FACTOR = 0.2; // Коэффициент сглаживания для manual режима

interface PaperTextureLayerProps {
  containerSize: {
    width: number;
    height: number;
  };
  lumen?: SharedValue<number>;         // Для animation режима
  normRotationZ?: SharedValue<number>; // Для manual режима (акселерометр Z)
  featureMode: 'animation' | 'manual';
}

export function PaperTextureLayer({
                                    containerSize,
                                    lumen,
                                    normRotationZ,
                                    featureMode,
                                  }: PaperTextureLayerProps) {
  const previousOpacity = useRef(0); // Для сглаживания в manual режиме

  /**
   * Анимированный стиль для PaperTextureLayer
   * В animation режиме - текстура бумаги не видна
   * В manual режиме - вычисляем opacity на основе normRotationZ (акселерометр Z)
   */
  const animatedStyle = useAnimatedStyle(() => {
    let finalOpacity = 0;

    if (featureMode === 'animation') {
      // Animation режим: используем lumen
      const lumenValue = lumen?.value ?? 0;
      finalOpacity = lumenValue * 0.25; // Текстура бумаги имеет 0.25 интенсивности
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

      // Текстура бумаги имеет 0.25 интенсивности
      finalOpacity = smoothedOpacity * 0.25;
    }

    // Плавная анимация прозрачности
    return { opacity: withTiming(finalOpacity, { duration: 50 }) };
  });

  return (
    <Animated.View
      style={[
        styles.paperTextureLayer,
        animatedStyle,
        {
          width: containerSize.width,
          height: containerSize.height,
        }
      ]}
      pointerEvents="none"
    >
      <Image
        source={PAPER_TEXTURE}
        style={[
          styles.paperTextureImage,
          {
            width: containerSize.width,
            height: containerSize.height,
          }
        ]}
        resizeMode="stretch"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  paperTextureLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  paperTextureImage: {
    position: 'absolute',
  },
});

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { Sign } from '@/src';
import {useCustomOrientation} from "@/src/hooks/useCustomOrientation";
import {useSafeAreaInsets} from "react-native-safe-area-context";

interface ManualNavigationProps {
  obverseSigns: Sign[];
  reverseSigns: Sign[];
  currentSign: Sign | null;
  currentSide: 'obverse' | 'reverse';
  onSignSelect: (sign: Sign) => void;
  isAnimating: boolean;
}

/**
 * Точка признака с анимацией
 */
const SignPoint = memo(({
                          isSelected,
                          onPress,
                          disabled
                        }: {
  isSelected: boolean;
  onPress: () => void;
  disabled: boolean;
}) => {
  const scale = useSharedValue(isSelected ? 1.5 : 1);

  useEffect(() => {
    scale.value = withTiming(isSelected ? 1.5 : 1, { duration: 200 });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <Animated.View style={[styles.dot, animatedStyle]} />
    </TouchableOpacity>
  );
});

SignPoint.displayName = 'SignPoint';

/**
 * Навигационное меню для ручного режима
 */
export const ManualNavigation = memo(({
                                        obverseSigns,
                                        reverseSigns,
                                        currentSign,
                                        onSignSelect,
                                        isAnimating,
                                      }: ManualNavigationProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const orientation = useCustomOrientation();
  const insets = useSafeAreaInsets();

  // Реверсируем порядок точек для обеих сторон
  const reversedObverseSigns = useMemo(() => {
    return [...obverseSigns].reverse();
  }, [obverseSigns]);

  const reversedReverseSigns = useMemo(() => {
    return [...reverseSigns].reverse();
  }, [reverseSigns]);

  // Обновляем выбранный ID при смене знака
  useEffect(() => {
    if (currentSign) {
      setSelectedId(currentSign.sign_id);
    }
  }, [currentSign]);

  // Обработчик нажатия
  const handlePress = useCallback((sign: Sign) => {
    if (isAnimating) return;
    setSelectedId(sign.sign_id);
    onSignSelect(sign);
  }, [isAnimating, onSignSelect]);

  // Проверяем наличие знаков
  const hasObverse = obverseSigns.length > 0;
  const hasReverse = reverseSigns.length > 0;

  if (!hasObverse && !hasReverse) return null;

  return (
    <View style={[styles.container,
      { paddingLeft:insets.left,
        paddingRight: insets.right,
        paddingBottom: insets.bottom,
        height: orientation === 'PORTRAIT' ? 70 + insets.bottom : 40 + insets.bottom
      }
    ]}>
      <View style={styles.content}>
        {/* Левая колонка - лицевая сторона (реверсирована) */}
        {hasObverse && (
          <View style={styles.column}>
            {reversedObverseSigns.map(sign => (
              <SignPoint
                key={sign.sign_id}
                isSelected={selectedId === sign.sign_id}
                onPress={() => handlePress(sign)}
                disabled={false}
              />
            ))}
          </View>
        )}

        {/* Разделитель */}
        {hasObverse && hasReverse && <View style={styles.divider} />}

        {/* Правая колонка - оборотная сторона (реверсирована) */}
        {hasReverse && (
          <View style={styles.column}>
            {reversedReverseSigns.map(sign => (
              <SignPoint
                key={sign.sign_id}
                isSelected={selectedId === sign.sign_id}
                onPress={() => handlePress(sign)}
                disabled={false}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

ManualNavigation.displayName = 'ManualNavigation';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 200
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0,
  },
  column: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
    flexWrap: 'wrap',
  },
  divider: {
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    marginHorizontal: 0,
    height: '100%',
    alignSelf: 'center',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    // Добавляем для правильного позиционирования
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ManualNavigation;
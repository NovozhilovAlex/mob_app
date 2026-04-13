import React from 'react';
import {
  View,
  Image,
  StyleSheet,
} from 'react-native';
import IMAGE_MAP, {findImageInMap} from "@/src/utils/imageMap";
import { dataCacheService } from "@/src/services/DataCacheService";
import {useCustomOrientation} from "@/src/hooks/useCustomOrientation";

interface BanknoteCarouselItemProps {
  nominal: any;
  modification: any;
  width: number;
  height: number;
  isActive: boolean;
}

export default function BanknoteCarouselItem({
                                               nominal,
                                               modification,
                                               width,
                                               height,
                                               isActive,
                                             }: BanknoteCarouselItemProps) {
  // Проверяем ориентацию банкноты
  const isLandscape = modification?.bnk_size_width > modification?.bnk_size_height;

  const orientation = useCustomOrientation();

  // Рассчитываем размеры как в Banknote3DView
  const calculateContainerSize = () => {
    if (!modification) {
      return { width: width, height: height };
    }

    // Получаем размеры банкноты
    const bnkWidth = modification.bnk_size_width;
    const bnkHeight = modification.bnk_size_height;

    // Рассчитываем соотношение сторон
    const aspectRatio = bnkWidth / bnkHeight;

    // Если банкнота горизонтальная (ландшафтная)
    if (isLandscape) {
      // Для отображения в вертикальном контейнере поворачиваем на 90 градусов
      const rotatedAspectRatio = 1 / aspectRatio;

      // Доступная ширина и высота контейнера (с учетом отступов)
      const maxWidth = width;
      const maxHeight = height;

      let calculatedWidth = 0;
      let calculatedHeight = 0;
      if (orientation === 'PORTRAIT'){
        calculatedWidth = maxWidth;
        calculatedHeight = calculatedWidth / rotatedAspectRatio;

        if (calculatedHeight > maxHeight) {
          calculatedHeight = maxHeight;
          calculatedWidth = calculatedHeight * rotatedAspectRatio;
        }
      }
      else
      {
        calculatedHeight = maxHeight;
        calculatedWidth = calculatedHeight / rotatedAspectRatio;

        if (calculatedWidth > maxWidth) {
          calculatedWidth = maxWidth;
          calculatedHeight = calculatedWidth * rotatedAspectRatio;
        }
      }

      // Если высота превышает доступную, масштабируем по высоте
      return {
        width: calculatedWidth,
        height: calculatedHeight
      };
    }
    // Если банкнота вертикальная (портретная)
    else {
      const maxWidth = width;
      const maxHeight = height;

      let calculatedWidth = 0;
      let calculatedHeight = 0;

      if (orientation === 'PORTRAIT'){
        calculatedWidth = maxWidth;
        calculatedHeight = calculatedWidth / aspectRatio;

        // Если высота превышает доступную, масштабируем по высоте
        if (calculatedHeight > maxHeight) {
          calculatedHeight = maxHeight;
          calculatedWidth = calculatedHeight * aspectRatio;
        }
      }
      else
      {
        calculatedHeight = maxHeight;
        calculatedWidth = calculatedHeight / aspectRatio;

        if (calculatedWidth > maxWidth) {
          calculatedWidth = maxWidth;
          calculatedHeight = calculatedWidth * aspectRatio;
        }
      }
      return {
        width: calculatedWidth,
        height: calculatedHeight
      };
    }
  };

  // Получаем изображение банкноты (только аверс)
  const getBanknoteImage = () => {
    if (!modification) return IMAGE_MAP.placeholder;

    try {
      const pictures = dataCacheService.getPicturesByModification(modification.modification_id);
      const obverseImage = pictures?.obverse?.pic_a;

      if (!obverseImage)
        return IMAGE_MAP.placeholder;

      return findImageInMap(obverseImage);
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
    }

    return IMAGE_MAP.placeholder;
  };

  const imageSource = getBanknoteImage();

  const imageDimensions = calculateContainerSize();

  return (
    <View style={[
      styles.container,
      {
        width,
        height,
        shadowOpacity: isActive ? 0.4 : 0.2,
        elevation: isActive ? 8 : 4
      }
    ]}>
      {imageSource !== IMAGE_MAP.placeholder && (
        <View style={styles.imageWrapper}>
          <Image
            source={imageSource}
            style={[
              styles.image,
              {
                width: orientation === 'PORTRAIT' ? imageDimensions.height : imageDimensions.width,
                height: orientation === 'PORTRAIT' ? imageDimensions.width : imageDimensions.height,
                transform: [
                  {
                    rotateZ: orientation === 'PORTRAIT' ? '90deg' : '0deg'
                  }
                ]
              }
            ]}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

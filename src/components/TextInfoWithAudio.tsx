import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  PanResponder, Image,
} from 'react-native';
import {Audio} from 'expo-av';
import {useAppSettingsStore} from '@/src/services/AppSettingsService';
import {dataCacheService} from '@/src/services/DataCacheService';
import {ModificationWithDetails} from '@/src';
import {getAudioSource} from '@/src/utils/audioMap';
import {useAudio, AudioTrack} from '@/src/hooks/useAudio';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppColors} from "@/src/constants/appColors";
import {useCustomOrientation} from "@/src/hooks/useCustomOrientation";

interface TextInfoWithAudioProps {
  titleId: number | undefined;
  titleRus: string | undefined;
  titleEng: string | undefined;

  descriptionId: number | undefined;
  descriptionRus: string | undefined;
  descriptionEng: string | undefined;

  isVisible: boolean;
  onClose: () => void;
}

const TextInfoWithAudio = ({
                                     titleId,
                                     titleRus,
                                     titleEng,
                                     descriptionId,
                                     descriptionRus,
                                     descriptionEng,
                                     isVisible,
                                     onClose
                                   }: TextInfoWithAudioProps) => {
  const {getCurrentLanguage, language, nightMode} = useAppSettingsStore();

  const {
    isPlaying,
    isPaused,
    isLoading,
    isMerging,
    duration,
    position,
    playAudioListAsMerged,
    pauseAudio,
    resumeAudio,
    stopAudio,
    seekInMerged,
  } = useAudio();

  const orientation = useCustomOrientation();
  const insets = useSafeAreaInsets();

  const [fullAudioTracks, setFullAudioTracks] = useState<AudioTrack[]>([]);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [isFirstShow, setIsFirstShow] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [tempPosition, setTempPosition] = useState<number | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Анимации для модального окна
  const modalSlideAnim = useRef(new Animated.Value(0)).current;
  const modalBackdropAnim = useRef(new Animated.Value(0)).current;
  const sliderPositionAnim = useRef(new Animated.Value(0)).current;

  const isMountedRef = useRef(true);
  const progressBarRef = useRef<View>(null);
  const progressBarLayout = useRef({x: 0, width: 0});

  // Анимация открытия/закрытия модального окна
  useEffect(() => {
    if (isVisible) {
      // Анимация появления
      Animated.parallel([
        Animated.timing(modalBackdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalSlideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Анимация скрытия
      Animated.parallel([
        Animated.timing(modalBackdropAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(modalSlideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  // Инициализация аудио
  useEffect(() => {
    console.log('🔊 Компонент аудио монтируется');
    isMountedRef.current = true;

    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('✅ Аудио режим настроен');
      } catch (error) {
        console.error('❌ Ошибка настройки аудио режима:', error);
      }
    };

    setupAudio();

    return () => {
      console.log('🔊 Компонент аудио размонтируется');
      isMountedRef.current = false;
      stopAudio();
      setShowAudioPlayer(false);
      setIsFirstShow(true);
    };
  }, []);

  // Получаем аудио для названия и описания из кэша
  const {nameAudio, descriptionAudio} = React.useMemo(() => {
    console.log('🔍 Получаем аудио из кэша для модификации:', {
      titleId: titleId,
      descriptionId: descriptionId
    });

    const nameAudios = titleId
      ? dataCacheService.getAudioForString(titleId)
      : [];

    const descAudios = descriptionId
      ? dataCacheService.getAudioForString(descriptionId)
      : [];

    console.log('📊 Найдено аудио:', {
      name: nameAudios.map(a => a.audio_path),
      description: descAudios.map(a => a.audio_path)
    });

    return {
      nameAudio: nameAudios,
      descriptionAudio: descAudios,
    };
  }, [titleId, descriptionId]);

  // Фильтруем аудио по текущему языку
  const {currentLanguageNameAudio, currentLanguageDescriptionAudio} = React.useMemo(() => {
    const filterByLanguage = (audioList: any[]) => {
      if (audioList.length === 0) {
        return [];
      }

      const filtered = audioList.filter(audio => {
        const path = (audio.audio_path || '').toLowerCase();
        if (getCurrentLanguage() === 'rus') {
          return path.includes('rus') || !path.includes('eng');
        } else if (getCurrentLanguage() === 'eng') {
          return path.includes('eng');
        }
        return true;
      });

      return filtered;
    };

    return {
      currentLanguageNameAudio: filterByLanguage(nameAudio),
      currentLanguageDescriptionAudio: filterByLanguage(descriptionAudio),
    };
  }, [nameAudio, descriptionAudio, language]);

  // Подготавливаем аудио треки при монтировании компонента
  useEffect(() => {
    const prepareAudioTracks = async () => {
      const tracks: AudioTrack[] = [];

      // Сначала добавляем треки для названия
      for (const audio of currentLanguageNameAudio) {
        try {
          const audioSource = getAudioSource(audio.audio_path);
          tracks.push({
            audioSource,
            path: audio.audio_path,
            type: 'name'
          });
          console.log(`✅ Добавлен аудио для названия: ${audio.audio_path}`);
        } catch (error) {
          console.warn(`⚠️ Не удалось загрузить аудио для названия: ${audio.audio_path}`, error);
        }
      }

      // Потом добавляем треки для описания
      for (const audio of currentLanguageDescriptionAudio) {
        try {
          const audioSource = getAudioSource(audio.audio_path);
          tracks.push({
            audioSource,
            path: audio.audio_path,
            type: 'description'
          });
          console.log(`✅ Добавлен аудио для описания: ${audio.audio_path}`);
        } catch (error) {
          console.warn(`⚠️ Не удалось загрузить аудио для описания: ${audio.audio_path}`, error);
        }
      }

      if (isMountedRef.current) {
        setFullAudioTracks(tracks);
        console.log(`📁 Подготовлено ${tracks.length} аудио треков`);
      }
    };

    prepareAudioTracks();
  }, [currentLanguageNameAudio, currentLanguageDescriptionAudio]);

  // Автоматическое воспроизведение при первом открытии плеера
  useEffect(() => {
    if (showAudioPlayer && fullAudioTracks.length > 0 && isFirstShow) {
      handlePlayAudio();
      setIsFirstShow(false);
    }
  }, [showAudioPlayer, fullAudioTracks.length, isFirstShow]);

  // Управление воспроизведением
  const handlePlayAudio = useCallback(async () => {
    if (!isMountedRef.current) return;

    console.log('🎵 === УПРАВЛЕНИЕ ВОСПРОИЗВЕДЕНИЕМ ===');

    try {
      // Если на паузе, возобновляем
      if (isPaused) {
        console.log('▶️ Возобновляю воспроизведение');
        await resumeAudio();
        return;
      }

      // Если уже играет, ставим на паузу
      if (isPlaying) {
        console.log('⏸️ Ставлю на паузу');
        await pauseAudio();
        return;
      }

      // Если не играет, начинаем воспроизведение
      if (fullAudioTracks.length === 0) {
        console.log('⚠️ Нет доступных аудио для воспроизведения');
        return;
      }

      console.log(`🎯 Начинаю воспроизведение ${fullAudioTracks.length} аудио файлов`);
      setIsLoadingAudio(true);
      await playAudioListAsMerged(fullAudioTracks);
      setIsLoadingAudio(false);
      console.log('✅ Запущено воспроизведение');

    } catch (error: any) {
      console.error('❌ Ошибка управления воспроизведением:', error);
      setIsLoadingAudio(false);
    }
  }, [isPlaying, isPaused, fullAudioTracks, playAudioListAsMerged, pauseAudio, resumeAudio]);

  // Обработчик нажатия на иконку звука
  const handleSoundIconPress = useCallback(() => {
    if (fullAudioTracks.length === 0) return;

    if (showAudioPlayer) {
      // Если плеер уже показан, скрываем его и останавливаем воспроизведение
      stopAudio();
      setShowAudioPlayer(false);
      setIsFirstShow(true);
    } else {
      // Если плеер скрыт, показываем его
      setShowAudioPlayer(true);
    }
  }, [showAudioPlayer, fullAudioTracks.length, stopAudio]);

  // Останавливаем аудио при закрытии плеера
  useEffect(() => {
    if (!showAudioPlayer && (isPlaying || isPaused)) {
      stopAudio();
    }
  }, [showAudioPlayer, isPlaying, isPaused, stopAudio]);

  // Получаем текст на текущем языке
  const getLocalizedText = useCallback((rus?: string, eng?: string): string => {
    if (getCurrentLanguage() === 'rus' && rus) return rus;
    if (getCurrentLanguage() === 'eng' && eng) return eng;
    return rus || eng || '';
  }, [getCurrentLanguage()]);

  const nameText = getLocalizedText(
    titleRus,
    titleEng
  );

  const descriptionText = getLocalizedText(
    descriptionRus,
    descriptionEng
  );

  // Форматирование времени
  const formatTime = useCallback((millis: number): string => {
    if (!millis || millis <= 0) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Обработчик завершения перетаскивания
  const handleDragEnd = useCallback(async () => {
    if (!isDragging || tempPosition === null || duration <= 0) return;

    const finalPosition = tempPosition;
    console.log(`🎯 Завершение перетаскивания: ${formatTime(finalPosition)}`);

    setIsDragging(false);
    setTempPosition(null);

    // Воспроизводим с новой позиции
    await seekInMerged(finalPosition, !isPaused);
  }, [isDragging, tempPosition, duration, isPaused, seekInMerged, formatTime]);

  // PanResponder для перетаскивания
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (duration <= 0) return;
        setIsDragging(true);
        setTempPosition(position);

        // Останавливаем воспроизведение при начале перетаскивания
        if (isPlaying) {
          pauseAudio();
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!isDragging || duration <= 0 || !progressBarLayout.current.width) return;

        const progressBarWidth = progressBarLayout.current.width;
        const startX = progressBarLayout.current.x;

        // Используем абсолютную позицию касания
        const pageX = evt.nativeEvent.pageX;
        const relativeX = pageX - startX;

        const percentage = Math.max(0, Math.min(1, relativeX / progressBarWidth));
        const newPosition = duration * percentage;

        setTempPosition(newPosition);
        sliderPositionAnim.setValue(relativeX);
      },
      onPanResponderRelease: () => {
        handleDragEnd();
      },
      onPanResponderTerminate: handleDragEnd,
    })
  ).current;

  // Обновление позиции ползунка
  const updateSliderPosition = useCallback((millis: number) => {
    if (duration <= 0) return;

    const progressBarWidth = progressBarLayout.current.width || Dimensions.get('window').width - 32;
    const percentage = Math.max(0, Math.min(1, millis / duration));
    const xPosition = percentage * progressBarWidth;

    sliderPositionAnim.setValue(xPosition);
  }, [duration]);

  // Обновляем позицию ползунка при изменении позиции воспроизведения
  useEffect(() => {
    if (!isDragging && duration > 0) {
      updateSliderPosition(position);
    }
  }, [position, duration, isDragging, updateSliderPosition]);

  // Инициализация прогресс-бара
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.measure((x, y, width, height, pageX, pageY) => {
        progressBarLayout.current = {x: pageX, width};
        updateSliderPosition(position);
      });
    }
  }, [showAudioPlayer, position]);

  // Получаем процент прогресса
  const getProgressPercentage = () => {
    if (duration <= 0) return 0;
    const currentPos = isDragging && tempPosition !== null ? tempPosition : position;
    return (currentPos / duration) * 100;
  };

  // Обработчик нажатия на прогресс-бар
  const handleProgressPress = useCallback(async (locationX: number) => {
    if (duration <= 0 || !progressBarLayout.current.width) return;

    const progressBarWidth = progressBarLayout.current.width;
    const percentage = Math.max(0, Math.min(1, locationX / progressBarWidth));
    const seekPosition = duration * percentage;

    console.log(`⏩ Перемотка на ${formatTime(seekPosition)} (${percentage.toFixed(2)}%)`);

    await seekInMerged(seekPosition, !isPaused);
  }, [duration, isPaused, seekInMerged, formatTime]);

  // Обработчик закрытия модального окна
  const handleCloseModal = () => {
    stopAudio();
    setShowAudioPlayer(false);
    setIsFirstShow(true);
    onClose();
  };

  // Анимационные стили для модального окна
  const modalBackdropStyle = {
    opacity: modalBackdropAnim,
  };

  const modalContentStylePortrait = {
    transform: [
      {
        translateY: modalSlideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [Dimensions.get('window').height, 0],
        }),
      },
    ],
  };

  const modalContentStyleLandscape = {
    transform: [
      {
        translateX: modalSlideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [Dimensions.get('window').width, 0],
        }),
      },
    ],
  };

  // Функция для обработки текста с nobr тегами - только для nameText
  const processNobrText = (text: string): string => {
    if (!text || !text.includes('<nobr>')) {
      return text;
    }

    // Находим все содержимое внутри тегов nobr и заменяем пробелы на неразрывные
    return text.replace(/<nobr>(.*?)<\/nobr>/gis, (match, content) => {
      // Заменяем все пробелы внутри nobr на неразрывные пробелы
      return content.replace(/ /g, '\u00A0');
    }).replace(/<[^>]*>/g, ''); // Удаляем все остальные HTML теги
  };

  // Если модальное окно не видимо, не рендерим его
  if (!isVisible) {
    return null;
  }

  const renderContent = () => (
    <>
      {/* Заголовок с названием и кнопкой звука - используем processNobrText только здесь */}
      <View style={[styles.modalHeader,
        {
          minHeight: orientation === 'PORTRAIT' ? 70 : 40
        }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.modalTitle, {color: nightMode ? '#FFFFFF' : '#000000'}]}>
            {processNobrText(nameText)}
          </Text>
        </View>
        <View style={[
          styles.headerRight,
          {
            minHeight: orientation === 'PORTRAIT' ? 70 : 40,
          }
          ]
        }>
          {/* Кнопка закрытия */}
          <TouchableOpacity
            onPress={handleCloseModal}
            style={styles.modalCloseButton}
          >
            <Image
              source={require('@/assets/Image/Resources/Icons/WhiteCancelIcon.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: nightMode ? '#FFFFFF' : '#000000',
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Бордер под заголовком */}
      <View style={[styles.headerBorder,
        {
          backgroundColor: nightMode ? AppColors.dark.borderColor: AppColors.light.borderColor,
        }]}/>

      {/* Блок аудиоплеера */}
      {showAudioPlayer && (
        <>
          <View style={[styles.modalHeader, {
            height: 50
          }]}>
            <View style={styles.headerLeft}>
              {/* Прогресс-бар с улучшенным управлением */}
              <View style={styles.progressContainer}>
                {/* Прогресс-бар с сенсорной областью */}
                <View
                  style={styles.progressBarWrapper}
                  ref={progressBarRef}
                  onLayout={(event) => {
                    const {width} = event.nativeEvent.layout;
                    progressBarLayout.current.width = width;
                    updateSliderPosition(position);
                  }}
                >
                  <View
                    style={styles.progressBarContainer}
                    {...panResponder.panHandlers}
                  >
                    <TouchableOpacity
                      style={styles.progressBarTouchArea}
                      activeOpacity={1}
                      onPress={(evt) => {
                        const touchX = evt.nativeEvent.locationX;
                        handleProgressPress(touchX);
                      }}
                      hitSlop={{top: 30, bottom: 30, left: 0, right: 0}}
                    >
                      <View style={[styles.progressBarBackground,
                        {
                          backgroundColor: nightMode ? AppColors.dark.borderColor: AppColors.light.borderColor,
                        }
                      ]}>
                        {/* Заполненная часть */}
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${getProgressPercentage()}%`
                            }
                          ]}
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Кнопка воспроизведения/паузы */}
              <TouchableOpacity
                onPress={handlePlayAudio}
                disabled={isLoading || isMerging || isLoadingAudio || fullAudioTracks.length === 0}
                style={styles.audioControlButton}
              >
                {!isPlaying && (
                  <Image
                    source={require('@/assets/Image/Resources/Icons/Button-play.png')}
                    style={{
                      width: 18,
                      height: 18,
                      tintColor: nightMode ? '#FFFFFF' : '#000000',
                    }}
                    resizeMode="contain"
                  />
                )}

                {isPlaying && (
                  <Image
                    source={require('@/assets/Image/Resources/Icons/Button-pause.png')}
                    style={{
                      width: 18,
                      height: 18,
                      tintColor: nightMode ? '#FFFFFF' : '#000000',
                    }}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Бордер под аудиоплеером */}
          <View style={[styles.headerBorder,
            {
              backgroundColor: nightMode ? AppColors.dark.borderColor: AppColors.light.borderColor,
            }]}/>
        </>
      )}

      {/* Описание модификации - оставляем без изменений */}
      <View style={styles.descriptionRow}>
        <ScrollView
          contentContainerStyle={styles.descriptionContent}
          nestedScrollEnabled={true}
        >
          <View style={styles.descriptionHeader}>
            <View style={styles.headerLeft}>
              <Text style={[
                styles.descriptionValue,
                {color: nightMode ? '#FFFFFF' : '#000000'}
              ]}>
                {descriptionText || 'Описание отсутствует'}
              </Text>
            </View>
            <View style={[styles.headerRight, {
              height:70
            }]}>
              {/* Иконка звука */}
              <TouchableOpacity
                onPress={handleSoundIconPress}
                disabled={fullAudioTracks.length === 0}
                style={styles.soundIconButton}
              >
                {!showAudioPlayer && (
                  <Image
                    source={require('@/assets/Image/Resources/Icons/PlayAudioIcon.png')}
                    style={{
                      width: 40,
                      height: 40,
                      tintColor: nightMode ? '#FFFFFF' : '#000000',
                    }}
                    resizeMode="contain"
                  />
                )}

                {showAudioPlayer && (
                  <Image
                    source={require('@/assets/Image/Resources/Icons/StopAudioIcon.png')}
                    style={{
                      width: 40,
                      height: 40,
                      tintColor: nightMode ? '#FFFFFF' : '#000000',
                    }}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );

  return (
    <View style={styles.modalContainer}>
      {/* Затемненный фон */}
      <Animated.View
        style={[
          styles.modalBackdrop,
          modalBackdropStyle
        ]}
      >
        <TouchableOpacity
          style={styles.modalBackdropTouchable}
          activeOpacity={1}
          onPress={handleCloseModal}
        />
      </Animated.View>

      {/* Контент модального окна */}
      <Animated.View style={[
        styles.modalContent,
        orientation === 'PORTRAIT' ? styles.modalContentPositionPortrait : styles.modalContentPositionLandscape,
        orientation === 'PORTRAIT' ? modalContentStylePortrait : modalContentStyleLandscape
      ]}>
        <View style={[styles.modalBodyContainer,
          {
            backgroundColor: nightMode ? AppColors.dark.bgColor : AppColors.light.bgColor
          },
          orientation === 'PORTRAIT'
          ? {
            paddingTop: 0,
            paddingLeft: insets.left,
            paddingBottom: insets.bottom,
            paddingRight: insets.right
          }
          : {
            paddingLeft: 0,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingRight: insets.right
          }
        ]}>
          {renderContent()}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Стили для модального окна
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdropTouchable: {
    flex: 1,
  },


  modalContent: {
    position: 'absolute',
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  modalContentPositionPortrait: {
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%'
  },
  modalContentPositionLandscape: {
    top: 0,
    bottom: 0,
    right: 0,
    width: '50%'
  },
  modalBodyContainer: {
    flex: 1,
  },

  // Стили для заголовка
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 0,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
    paddingLeft: 16,
    paddingVertical: 8
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 22,
    color: '#FFFFFF',
    flexWrap: 'wrap',
  },
  soundIconButton: {
    padding: 8,
    marginRight: 2,
  },
  modalCloseButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 0,
  },
  headerBorder: {
    height: 1,
  },

  // Стили для аудиоплеера
  audioControlButton: {
    width: 40, height:40,
    backgroundColor: '#41ACB5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Стили для прогресс-бара
  progressContainer: {
    width: '100%',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressBarWrapper: {
    width: '100%',
    position: 'relative',
  },
  progressBarContainer: {
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  progressBarTouchArea: {
    width: '100%',
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 2,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#41ACB5',
    borderRadius: 2,
  },

  // Стили для описания
  descriptionRow: {
    flex: 1,
    marginBottom: Platform.OS === 'android' ? 20 : 0,
  },
  descriptionContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
  },
  descriptionValue: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
});

export default TextInfoWithAudio;
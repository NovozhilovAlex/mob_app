import {Animated, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import * as React from "react";
import {useLocalSearchParams, useRouter} from 'expo-router';
import {SafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import {useCallback, useEffect, useRef, useState} from "react";
import {Modification} from "@/src";
import IMAGE_MAP, {findImageInMap} from "@/src/utils/imageMap";
import {dataCacheService} from "@/src/services/DataCacheService";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {Ionicons} from "@expo/vector-icons";
import ButtonWithIcon from "@/src/components/ButtonWithIcon";
import {AudioTrack, useAudio} from "@/src/hooks/useAudio";
import {getAudioSource} from "@/src/utils/audioMap";
import { Audio } from 'expo-av';
import {useTranslation} from "react-i18next";
import PageTitle from "@/src/components/PageTitle";
import {useNavigationService} from "@/src/services/NavigationService";
import {useCustomOrientation} from "@/src/hooks/useCustomOrientation";
import FullScreenGradient from "@/src/components/FullScreenGradient";
import PageWithTitle from "@/src/components/PageWithTitle";
import OrientationConfig from "@/src/components/OrientationConfig";

// 1. Описываем структуру параметров
export interface RecognizeResultParams {
  type: "FindModification" | "SignCheck";
  modificationId: string;
  side: "1" | "2";
  signCheckResult: "SignsDefined" | "TryAgain" | "SignsNotDefined";
  [key: string]: string | undefined;
}

export default function RecognizeResult() {
  const ROTATION_DURATION = 1200;
  const DEFAULT_PERSPECTIVE = 1000;

  const params = useLocalSearchParams() as unknown as Partial<RecognizeResultParams>;

  const playAudioIcon = require('@/assets/Image/Resources/Icons/PlayAudioIcon.png');
  const stopAudioIcon = require('@/assets/Image/Resources/Icons/StopAudioIcon.png');
  const rubleIcon = require('@/assets/Image/Resources/Icons/Ruble.png');
  const loupeIcon = require('@/assets/Image/Resources/Icons/Loupe.png');
  const cameraIcon = require('@/assets/Image/Resources/Icons/CameraIcon.png');

  const modificationId = Number(params.modificationId);
  let isReverse = Boolean(params.side === "2");

  const router = useRouter();
  const orientation = useCustomOrientation();

  const { getCurrentLanguage, audioRecognition } = useAppSettingsStore();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const [bnkImages, setBnkImages] = useState<{ obverse?: any; reverse?: any }>({});

  const [modificationInfo, setModificationInfo] = useState<
    {
      name?: string,
      nameAudio?: any,
      isSignCheckAvailable?:boolean,
      aspectRatio?: number,
    }>({});


  const {
    isPlaying,
    isPaused,
    playAudioListAsMerged,
    pauseAudio,
    resumeAudio,
    stopAudio,
  } = useAudio();

  useEffect(() => {

    initImages();
    initBanknoteInfo();
  }, []);


  const isMountedRef = useRef(true);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const fullAudioTracks = useRef<AudioTrack[]>([]);
  const navigationService = useNavigationService();

  function initImages() {
    const picturesData =
      dataCacheService.getPicturesByModification(modificationId);

    let picObversePath = picturesData.obverse?.pic_a;
    let picReversePath = picturesData.reverse?.pic_r;

    let picObverse = picObversePath ? findImageInMap(picObversePath) : IMAGE_MAP.placeholder;
    let picReverse = picReversePath ? findImageInMap(picReversePath) : IMAGE_MAP.placeholder;

    setBnkImages(
      {
        obverse: picObverse,
        reverse: picReverse
      })
  }

  function IsSignCheckAvailable(modificationData: Modification) {
    if (modificationData.modification_id === 16 || // 1000_10
      modificationData.modification_id === 17 || // 2000_17
      modificationData.modification_id === 19 || // 5000_10
      modificationData.modification_id === 27) // 5000_23
      return true;
    return false;
  }

  // Получаем текст на текущем языке
  const getLocalizedText = useCallback((rus?: string, eng?: string): string => {
    if (getCurrentLanguage() === 'rus' && rus) return rus;
    if (getCurrentLanguage() === 'eng' && eng) return eng;
    return rus || eng || '';
  }, [getCurrentLanguage()]);

  function initBanknoteInfo() {
    const modificationData = dataCacheService.getModificationById(modificationId);

    const modificationWithFullDetails =
      dataCacheService.getModificationWithFullDetails(modificationId);

    let aspectRatio = (modificationData.bnk_size_width ?? 0) / (modificationData.bnk_size_height ?? 0);
    if (aspectRatio < 1.1)
      aspectRatio = 1.1;

    let nameAudio = modificationData.modification_fullname != null
      ? dataCacheService.getAudioForString(modificationData.modification_fullname)
      : null;

    const nameAudioLang = nameAudio?.filter(audio => {
      const path = (audio.audio_path || '').toLowerCase();
      if (getCurrentLanguage() === 'rus') {
        return path.includes('rus') || !path.includes('eng');
      } else if (getCurrentLanguage() === 'eng') {
        return path.includes('eng');
      }
      return true;
    });
    prepareAudioTracks(nameAudioLang).then();

    setModificationInfo({
      name: processNobrText(getLocalizedText(
        modificationWithFullDetails?.fullname_rus,
        modificationWithFullDetails?.fullname_eng)),
      nameAudio: nameAudio,
      isSignCheckAvailable: IsSignCheckAvailable(modificationData),

      aspectRatio: aspectRatio
    });
    console.log('initBanknoteInfo complete. ', modificationInfo)
  }

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

  const getTitlePath = (): string => {
    switch (params.type){
      case 'FindModification': {
        return t('audio.bnkFound');
      }
      case 'SignCheck': {
        switch (params.signCheckResult) {
          case 'SignsDefined':
            return t('audio.positive');
          case 'TryAgain':
            return t('audio.tryAgain');
          case 'SignsNotDefined':
            return t('audio.negative');
        }
      }
    }

    return '';
  };

  const prepareAudioTracks = async (currentLanguageNameAudio:any) => {
    const tracks: AudioTrack[] = [];

    console.log('prepareAudioTracks. language:', getCurrentLanguage());

    const titlePath = getTitlePath();

    const audioSource = getAudioSource(titlePath);
    tracks.push({
      audioSource,
      path: titlePath
    });

    if (params.type === 'FindModification') {

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
    }

    if (isMountedRef.current) {
      fullAudioTracks.current = tracks;
      console.log(`📁 Подготовлено ${tracks.length} аудио треков`);
    }
  };

  const rotateAnim = useRef(new Animated.Value(isReverse ? 180 : 0)).current;

  const rotate = () => {
    if (!isReverse) {
      Animated.timing(rotateAnim, {
        toValue: 180,
        duration: ROTATION_DURATION,
        useNativeDriver: true,
      }).start();
      isReverse = true;
    }
    else {
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: ROTATION_DURATION,
        useNativeDriver: true,
      }).start();
      isReverse = false;
    }

  };

  const openModification = async () => {
    const modificationId = params.modificationId;
    const side = params.side;

    navigationService.openModificationPage(modificationId, side)
  };

  const openSignCheck = async () => {
    router.push({
      pathname: "/sign-check",
      params: {
        modificationId: modificationId
      }
    });
  };

  const goBack = async () => {
    router.back();
  };

  const goToFindModification = async () => {
    router.back();
    router.back();
    router.back();
  };

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

        if (audioRecognition){
          console.log("audioRecognition play");
          try{
            await playAudio();
          }
          catch (error) {
            console.warn(`Ошибка запуска аудио`, error);
          }
        }
      } catch (error) {
        console.error('❌ Ошибка настройки аудио режима:', error);
      }
    };

    setupAudio();

    return () => {
      console.log('🔊 Компонент аудио размонтируется');
    };
  }, []);

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
        console.log('Stop аудио');
        await stopAudio();
        return;
      }

      await playAudio();

    } catch (error: any) {
      console.error('❌ Ошибка управления воспроизведением:', error);
      setIsLoadingAudio(false);
    }
  }, [isPlaying, isPaused, fullAudioTracks.current, playAudioListAsMerged, pauseAudio, resumeAudio]);

  async function playAudio() {
    // Если не играет, начинаем воспроизведение
    console.log('playAudio');
    if (fullAudioTracks.current.length === 0) {
      console.log('⚠️ Нет доступных аудио для воспроизведения');
      return;
    }

    console.log(`🎯 Начинаю воспроизведение ${fullAudioTracks.current.length} аудио файлов`);
    setIsLoadingAudio(true);
    await playAudioListAsMerged(fullAudioTracks.current);
    setIsLoadingAudio(false);
    console.log('✅ Запущено воспроизведение');
  }

  return (
    <View style={{flex: 1}}>
      <OrientationConfig/>
      <PageWithTitle title={<PageTitle title={t('camera.recognizeResultTitle')} isMenuEnable={true} />}
                     background={<FullScreenGradient/>}
                     content={
                       <View style={styles.content}>
                         <View style={{flex:1,justifyContent:'center', alignItems:'center'}}>
                           {params.type === 'FindModification' && (
                             <Text style={{textAlign:'center', marginLeft:70, marginRight:70, color:'white', fontSize:16}}>
                               {modificationInfo.name}
                             </Text>
                           )}

                           {params.type === 'SignCheck' && (
                             <Text style={{textAlign:'center', marginLeft:70, marginRight:70, color:'white', fontSize:16}}>
                               {t('recognizeResult.appNotGuaranteeSignCheck')}
                             </Text>
                           )}

                           <View style={[styles.absoluteLayout,{alignItems: 'flex-end'}]}>
                             <View style={{width:70, height:70}}>
                               <TouchableOpacity
                                 style={styles.iconContainer}
                                 disabled={isLoadingAudio || fullAudioTracks.current.length === 0}
                                 onPress={handlePlayAudio}
                                 activeOpacity={0.5}>
                                 <Image
                                   source={isPlaying ? stopAudioIcon : playAudioIcon}
                                   style={{
                                     width: 40,
                                     height: 40
                                   }}
                                   resizeMode="contain"
                                 />
                               </TouchableOpacity>
                             </View>
                           </View>

                         </View>
                         <View style={{marginLeft:35, marginRight:35, zIndex:10, alignItems:'center', justifyContent:'center'}}>
                           <View style={{
                             width: orientation === 'PORTRAIT' ? '100%' : '40%',
                             aspectRatio: modificationInfo.aspectRatio,
                             alignItems:'center', justifyContent:'center'}}>
                             <Animated.View style={{
                               width: '100%',
                               height: '100%',
                               alignItems:'center', justifyContent:'center',
                               transform: [
                                 {perspective: DEFAULT_PERSPECTIVE},
                                 {
                                   rotateY:
                                     rotateAnim.interpolate({
                                       inputRange: [0, 180],
                                       outputRange: ['0deg', '180deg'],
                                     })
                                 }
                               ]

                             }} >
                               {/*Front*/}
                               <Animated.View style={[styles.absolute100percent,
                                 {
                                   opacity:
                                     rotateAnim.interpolate({
                                       inputRange: [0, 90, 90, 180],
                                       outputRange: [1, 1, 0, 0],
                                     })
                                 }
                               ]}>
                                 <Image
                                   source={bnkImages.obverse}
                                   style={styles.absolute100percent}
                                   resizeMode="contain"
                                 />
                               </Animated.View>

                               {/*Back*/}
                               <Animated.View style={[styles.absolute100percent,
                                 {
                                   opacity:
                                     rotateAnim.interpolate({
                                       inputRange: [0, 90, 90, 180],
                                       outputRange: [0, 0, 1, 1],
                                     }),
                                   transform: [
                                     {
                                       scaleX: -1
                                     }
                                   ]
                                 }
                               ]}>
                                 <Image
                                   source={bnkImages.reverse}
                                   style={styles.absolute100percent}
                                   resizeMode="contain"
                                 />
                               </Animated.View>
                             </Animated.View>

                             <Animated.View style={{ position:'absolute', alignSelf:'flex-end',
                               width:70, height:'100%', marginRight:-35,
                               justifyContent:'center', alignItems:'center',
                               opacity:rotateAnim.interpolate({
                                 inputRange: [0,10, 170, 180],
                                 outputRange: [1, 0, 0, 1],
                               })}}
                             >
                               <View style={{width:70, height:70}}>
                                 <TouchableOpacity
                                   style={[
                                     styles.flipCircleButton
                                   ]}
                                   onPress={()=>{rotate()}}
                                   activeOpacity={0.7}
                                 >
                                   <Ionicons
                                     name="sync"
                                     size={30}
                                     color={"#000"}
                                   />
                                 </TouchableOpacity>
                               </View>
                             </Animated.View>
                           </View>


                         </View>

                         <View style={[styles.alignCenter,{flex:1, paddingRight:70, paddingLeft:70}]}>
                           {params.type === 'FindModification' && (
                             <Text style={styles.recognizeResultString}>
                               {t('recognizeResult.bnkNominalAndModificationFound')}
                             </Text>
                           )}
                           {params.type === 'SignCheck' &&
                             params.signCheckResult === 'SignsDefined' && (
                               <Text style={styles.recognizeResultString}>
                                 {t('recognizeResult.signsDefined')}
                               </Text>
                             )}
                           {params.type === 'SignCheck' &&
                             params.signCheckResult === 'TryAgain' && (
                               <Text style={styles.recognizeResultString}>
                                 {t('recognizeResult.tryAgain')}
                               </Text>
                             )}
                           {params.type === 'SignCheck' &&
                             params.signCheckResult === 'SignsNotDefined' && (
                               <Text style={styles.recognizeResultString}>
                                 {t('recognizeResult.signsNotDefined')}
                               </Text>
                             )}
                         </View>
                         <View style={{
                           justifyContent:'center',
                           gap:20,
                           paddingBottom: orientation === 'PORTRAIT' ? 35 : 15,
                           alignItems: 'stretch',
                           flexDirection: orientation === 'PORTRAIT' ? 'column' : 'row',
                           marginHorizontal:70}}>
                           <ButtonWithIcon title={t('camera.openModification')}
                                           icon={rubleIcon}
                                           iconSize={16}
                                           onPress={openModification}/>

                           {modificationInfo.isSignCheckAvailable && (

                             <ButtonWithIcon title={
                               params.type === 'FindModification'
                                 ? t('camera.openSignCheck')
                                 : t('camera.repeat')
                             }
                                             icon={loupeIcon}
                                             iconSize={16}
                                             onPress={
                                               params.type === 'FindModification'
                                                 ? openSignCheck
                                                 : goBack}/>
                           )}

                           <ButtonWithIcon title={t('camera.tryAgain')}
                                           icon={cameraIcon}
                                           iconSize={22}
                                           onPress={
                                             params.type === 'FindModification'
                                               ? goBack
                                               : goToFindModification}/>
                         </View>
                       </View>
                     }
      />
    </View>
  );

}


const styles =  StyleSheet.create({

  absolute100percent: {
    position: 'absolute',
    width: '100%',
    height: '100%'
  },
  container: {
    flex: 1, // Занимает весь экран
    backgroundColor: 'white',
  },
  header: {
    height: 70, // Фиксированная высота
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center'
  },
  alignCenter: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    flex: 1, // Растягивается на всё свободное пространство
  },
  text: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  absoluteLayout:{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center'
  },
  iconContainer: {
    width:70,
    height:70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipCircleButton: {
    position: 'absolute',
    width: 46,
    height: 46,
    marginLeft:12,
    marginTop:12,
    borderRadius: 28,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 20,
  },
  recognizeResultString: {
    textAlign:'center',
    color:'white',
    fontSize:16
  }
});
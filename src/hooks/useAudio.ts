import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export interface AudioTrack {
    audioSource: any;
    path: string;
    type?: 'name' | 'description';
}

export const useAudio = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [duration, setDuration] = useState<number>(0);
    const [position, setPosition] = useState<number>(0);

    // Refs
    const soundRef = useRef<Audio.Sound | null>(null);
    const intervalRef = useRef<number | null>(null);
    const playlistRef = useRef<AudioTrack[]>([]);
    const trackIndexRef = useRef<number>(0);
    const durationsRef = useRef<number[]>([]);
    const cumulativeDurationsRef = useRef<number[]>([]);
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            stopAudio();
            isMountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Функция для склейки аудио файлов (упрощенная версия)
    const mergeAudioFiles = async (audioList: AudioTrack[]): Promise<string | null> => {
        if (!audioList || audioList.length === 0) return null;

        try {
            console.log('🔧 Начинаю обработку аудио файлов...');

            const durations: number[] = [];
            const cumulativeDurations: number[] = [];
            let totalDuration = 0;

            // 1. Получаем информацию о длительности каждого трека
            for (let i = 0; i < audioList.length; i++) {
                const track = audioList[i];

                try {
                    // Создаем звук для получения информации
                    const { sound: tempSound } = await Audio.Sound.createAsync(
                        track.audioSource,
                        { shouldPlay: false }
                    );

                    const status = await tempSound.getStatusAsync();
                    const trackDuration = status.isLoaded ? status.durationMillis || 0 : 0;

                    durations.push(trackDuration);
                    cumulativeDurations.push(totalDuration);
                    totalDuration += trackDuration;

                    await tempSound.unloadAsync();
                    console.log(`✅ Трек ${i + 1}: ${trackDuration}ms`);
                } catch (error) {
                    console.warn(`⚠️ Ошибка обработки трека ${i}:`, error);
                    durations.push(0);
                    cumulativeDurations.push(totalDuration);
                }
            }

            // Сохраняем длительности
            durationsRef.current = durations;
            cumulativeDurationsRef.current = cumulativeDurations;

            // 2. Создаем виртуальный идентификатор для объединенного трека
            const mergedUri = `virtual://merged_${Date.now()}`;

            console.log(`✅ Обработка завершена. Общая длительность: ${totalDuration}ms`);
            return mergedUri;

        } catch (error) {
            console.error('❌ Ошибка обработки аудио:', error);
            return null;
        }
    };

    // Воспроизвести список аудио как объединенную дорожку
    const playAudioListAsMerged = useCallback(async (audioList: AudioTrack[]) => {
        if (!isMountedRef.current || !audioList || audioList.length === 0) {
            console.error('❌ Audio list is empty or component unmounted');
            return;
        }

        try {
            console.log('🎵 Начинаю подготовку объединенного аудио...');

            // Останавливаем текущее воспроизведение
            if (soundRef.current) {
                await stopAudio();
            }

            setIsLoading(true);
            setIsMerging(true);
            setIsPaused(false);

            // Сохраняем плейлист
            playlistRef.current = audioList;
            trackIndexRef.current = 0;

            // Обрабатываем аудио (получаем длительности)
            const mergedUri = await mergeAudioFiles(audioList);

            if (!mergedUri || !isMountedRef.current) {
                setIsLoading(false);
                setIsMerging(false);
                return;
            }

            // Рассчитываем общую длительность
            const totalDuration = durationsRef.current.reduce((sum, dur) => sum + dur, 0);
            setDuration(totalDuration);
            setPosition(0);

            // Начинаем воспроизведение с первого трека
            await playTrackByIndex(0);

        } catch (error) {
            console.error('❌ Ошибка воспроизведения объединенного аудио:', error);
            if (isMountedRef.current) {
                setIsLoading(false);
                setIsMerging(false);
            }
        }
    }, []);

    // Воспроизведение трека по индексу
    const playTrackByIndex = async (index: number, startPositionInTrack: number = 0) => {
        if (!isMountedRef.current || !playlistRef.current[index]) return;

        try {
            console.log(`🎵 Воспроизведение трека ${index + 1}/${playlistRef.current.length}`);

            // Останавливаем предыдущий звук
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            }

            const audioItem = playlistRef.current[index];

            // Создаем новый звуковой объект
            const { sound: newSound } = await Audio.Sound.createAsync(
                audioItem.audioSource,
                {
                    shouldPlay: true,
                    positionMillis: startPositionInTrack,
                    volume: 1.0,
                    isLooping: false,
                    isMuted: false,
                }
            );

            soundRef.current = newSound;

            if (isMountedRef.current) {
                setIsPlaying(true);
                setIsPaused(false);
                setIsMerging(false);
                setIsLoading(false);
                trackIndexRef.current = index;
            }

            // Запускаем обновление позиции
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            intervalRef.current = setInterval(async () => {
                if (!isMountedRef.current || !soundRef.current) return;

                try {
                    const currentStatus = await soundRef.current.getStatusAsync();
                    if (currentStatus.isLoaded) {
                        const currentPosition = currentStatus.positionMillis || 0;

                        // Вычисляем общую позицию
                        const cumulativeDuration = cumulativeDurationsRef.current[index] || 0;
                        const totalPosition = cumulativeDuration + currentPosition;

                        if (isMountedRef.current) {
                            setPosition(totalPosition);
                        }

                        // Проверяем завершение трека
                        if (currentStatus.didJustFinish) {
                            console.log(`✅ Трек ${index + 1} завершен`);

                            // Очищаем интервал
                            if (intervalRef.current) {
                                clearInterval(intervalRef.current);
                                intervalRef.current = null;
                            }

                            // Переходим к следующему треку
                            const nextIndex = index + 1;
                            if (nextIndex < playlistRef.current.length) {
                                await playTrackByIndex(nextIndex);
                            } else {
                                completePlayback();
                            }
                        }
                    }
                } catch (error) {
                    console.error('Ошибка обновления позиции:', error);
                }
            }, 100);

            // Обработчик завершения трека (дублирующая логика для надежности)
            newSound.setOnPlaybackStatusUpdate(async (status: any) => {
                if (!isMountedRef.current || !status.isLoaded) return;

                if (status.didJustFinish) {
                    console.log(`✅ Трек ${index + 1} завершен (через onPlaybackStatusUpdate)`);

                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }

                    // Переходим к следующему треку
                    const nextIndex = index + 1;
                    if (nextIndex < playlistRef.current.length) {
                        await playTrackByIndex(nextIndex);
                    } else {
                        completePlayback();
                    }
                }
            });

        } catch (error) {
            console.error(`❌ Ошибка воспроизведения трека ${index + 1}:`, error);

            // Пробуем следующий трек
            const nextIndex = index + 1;
            if (nextIndex < playlistRef.current.length) {
                await playTrackByIndex(nextIndex);
            } else {
                completePlayback();
            }
        }
    };

    // Перемотка в объединенной дорожке
    const seekInMerged = useCallback(async (millis: number, shouldAutoPlay = true) => {
        if (durationsRef.current.length === 0 || !isMountedRef.current) return;

        try {
            const durations = durationsRef.current;
            const cumulativeDurations = cumulativeDurationsRef.current;

            // Находим, в каком треке находится позиция
            let targetIndex = 0;
            let positionInTrack = millis;

            for (let i = 0; i < durations.length; i++) {
                const cumulativeEnd = (cumulativeDurations[i] || 0) + durations[i];
                if (millis < cumulativeEnd) {
                    targetIndex = i;
                    positionInTrack = millis - (cumulativeDurations[i] || 0);
                    break;
                }
            }

            // Ограничиваем позицию в пределах трека
            if (positionInTrack < 0) positionInTrack = 0;
            if (positionInTrack > durations[targetIndex]) {
                positionInTrack = durations[targetIndex];
            }

            console.log(`🎯 Перемотка: трек ${targetIndex + 1}/${durations.length}, позиция: ${positionInTrack}ms`);

            // Обновляем состояние
            if (isMountedRef.current) {
                trackIndexRef.current = targetIndex;
                setPosition(millis);
            }

            // Останавливаем текущее воспроизведение
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }

            if (shouldAutoPlay) {
                // Воспроизводим с новой позиции
                await playTrackByIndex(targetIndex, positionInTrack);
            } else {
                // Загружаем трек без воспроизведения
                try {
                    const audioItem = playlistRef.current[targetIndex];
                    const { sound: newSound } = await Audio.Sound.createAsync(
                        audioItem.audioSource,
                        {
                            shouldPlay: false,
                            positionMillis: positionInTrack,
                            volume: 1.0,
                        }
                    );

                    if (soundRef.current) {
                        await soundRef.current.unloadAsync();
                    }

                    soundRef.current = newSound;

                    if (isMountedRef.current) {
                        setIsPaused(true);
                        setIsPlaying(false);
                    }
                } catch (error) {
                    console.error('❌ Ошибка загрузки трека:', error);
                }
            }

        } catch (error) {
            console.error('❌ Ошибка перемотки:', error);
        }
    }, []);

    // Пауза аудио
    const pauseAudio = useCallback(async () => {
        if (!soundRef.current || !isPlaying || isPaused) return;

        try {
            await soundRef.current.pauseAsync();
            setIsPaused(true);
            setIsPlaying(false);

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        } catch (error) {
            console.error('❌ Ошибка паузы:', error);
            setIsPlaying(false);
            setIsPaused(false);
        }
    }, [isPlaying, isPaused]);

    // Возобновление аудио
    const resumeAudio = useCallback(async () => {
        if (!soundRef.current || !isPaused || isPlaying) return;

        try {
            await soundRef.current.playAsync();
            setIsPaused(false);
            setIsPlaying(true);

            // Возобновляем обновление позиции
            if (!intervalRef.current) {
                const index = trackIndexRef.current;
                intervalRef.current = setInterval(async () => {
                    if (!isMountedRef.current || !soundRef.current) return;

                    try {
                        const currentStatus = await soundRef.current.getStatusAsync();
                        if (currentStatus.isLoaded) {
                            const currentPosition = currentStatus.positionMillis || 0;
                            const cumulativeDuration = cumulativeDurationsRef.current[index] || 0;
                            const totalPosition = cumulativeDuration + currentPosition;

                            if (isMountedRef.current) {
                                setPosition(totalPosition);
                            }
                        }
                    } catch (error) {
                        console.error('Ошибка обновления позиции:', error);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('❌ Ошибка возобновления:', error);
            setIsPaused(false);
        }
    }, [isPaused, isPlaying]);

    // Завершение воспроизведения
    const completePlayback = useCallback(() => {
        console.log('✅ Все треки воспроизведены');

        if (!isMountedRef.current) return;

        setIsPlaying(false);
        setIsPaused(false);
        trackIndexRef.current = 0;
        setPosition(duration); // Устанавливаем позицию в конец

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, [duration]);

    // Остановить аудио
    const stopAudio = useCallback(async () => {
        console.log('🛑 Останавливаю аудио...');

        if (!isMountedRef.current) return;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (soundRef.current) {
            try {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            } catch (error) {
                console.error('Ошибка остановки аудио:', error);
            }
        }

        soundRef.current = null;
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
        setIsMerging(false);
        setPosition(0);
    }, []);

    return {
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
    };
};
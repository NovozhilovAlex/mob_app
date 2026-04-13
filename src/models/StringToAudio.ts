/**
 * Интерфейс модели StringToAudio
 * Соответствует таблице string_to_audio
 */
export interface StringToAudio {
    id: number;
    id_string: number;
    id_audio: number;
    order?: number;
    language?: string;
    comment?: string;
}

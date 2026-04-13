/**
 * Интерфейс модели Audio
 * Соответствует таблице audio
 */
export interface Audio {
  audio_id: number;           // Первичный ключ
  audio_path: string;         // Путь к аудиофайлу
  comment?: string;           // Комментарий (опционально)
}

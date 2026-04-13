/**
 * Интерфейс модели Picture
 * Соответствует таблице picture из вашей миграции
 */
export interface Picture {
  pic_id: number;                     // Первичный ключ
  modification_id: number;            // Внешний ключ на modification
  pic_light_code?: string;            // Код освещения (2 символа)
  pic_a?: string;                     // Путь к изображению аверса (лицевая сторона)
  pic_r?: string;                     // Путь к изображению реверса (оборотная сторона)
  pic_a_transparentmask?: string;     // Путь к маске прозрачности аверса
  pic_r_transparentmask?: string;     // Путь к маске прозрачности реверса
  sign_scale?: number;                // Масштаб знаков
}

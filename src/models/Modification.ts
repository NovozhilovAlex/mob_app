import {Audio} from "@/src";

/**
 * Интерфейс модели Modification
 * Соответствует таблице modification
 */
export interface Modification {
  modification_id: number;            // Первичный ключ
  nominal_id?: number;                // Внешний ключ на nominal
  modification_year?: number;         // Год модификации
  modification_polymer?: boolean;     // Полимерная модификация
  modification_fullname?: number;     // Внешний ключ на string_res (полное название)
  modification_description?: number;  // Внешний ключ на string_res (описание)
  bnk_size_width?: number;            // Ширина банкноты
  bnk_size_height?: number;           // Высота банкноты
}

/**
 * Тип для модификации с дополнительными данными (JOIN запросы)
 */
export interface ModificationWithDetails extends Modification {
  nominal_value?: number;      // Значение номинала из таблицы nominal
  fullname_rus?: string;       // Полное название на русском
  fullname_eng?: string;       // Полное название на английском
  description_rus?: string;    // Описание на русском
  description_eng?: string;    // Описание на английском
}

/**
 * Тип для модификации с полными данными включая аудио
 */
export interface ModificationWithFullDetails extends ModificationWithDetails {
  // Аудио для названия модификации
  fullname_audio?: Audio[];
  // Аудио для описания модификации
  description_audio?: Audio[];
}

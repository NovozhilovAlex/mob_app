/**
 * Интерфейс модели Nominal
 * Соответствует таблице nominal
 */
export interface Nominal {
  nominal_id: number;      // Первичный ключ
  nominal_value: number;   // Значение номинала
}

/**
 * Тип для номинала с дополнительными данными
 */
export interface NominalWithStats extends Nominal {
  modification_count: number;  // Количество модификаций
  years?: string;              // Список лет через запятую
}

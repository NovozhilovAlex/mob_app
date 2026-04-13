/**
 * Интерфейс модели SignRes (таблица sign_res)
 */
export interface SignRes {
  sign_res_id: number;
  res_path: string;
  pos_x?: number;
  pos_y?: number;
  pos_z?: number;
  width?: number;
  height?: number;
  scale_x?: number;
  scale_y?: number;
  scale_z?: number;
  move_min_x?: number;
  move_min_y?: number;
  move_max_x?: number;
  move_max_y?: number;
  pivot_x?: number;
  pivot_y?: number;
  layer?: number;
}

/**
 * Интерфейс модели SignType (таблица sign_type)
 */
export interface SignType {
  sign_type_id: number;
  sign_type_code: string;
  sign_type_description: string;
}

/**
 * Интерфейс модели StringRes (таблица string_res)
 */
export interface StringRes {
  id: number;
  rus_string: string;
  eng_string: string;
}

/**
 * Интерфейс модели Sign
 * Соответствует таблице sign из вашей миграции
 */
export interface Sign {
  // Основные поля из таблицы sign
  sign_id: number;
  sign_type_id?: number;
  modification_id: number;
  sign_side?: number;
  sign_x?: number;
  sign_y?: number;
  sign_min_x?: number;
  sign_min_y?: number;
  sign_max_x?: number;
  sign_max_y?: number;
  sign_name_str?: string;
  sign_name?: number;
  sign_description?: number;
  sign_show_type?: number;
  sign_res1?: number;
  sign_res2?: number;
  sign_res3?: number;
  sign_res4?: number;
  sign_res5?: number;
  sign_res6?: number;
  sign_res7?: number;
  sign_view_rotate_angle?: number;
  sign_loupe_scale_value?: number;
  is_hide?: number;
  sign_scale_value?: number;

  // Вложенные объекты из связанных таблиц
  sign_type?: SignType;           // Полный объект sign_type
  sign_res1_data?: SignRes;       // Полный объект sign_res для res1
  sign_res2_data?: SignRes;       // Полный объект sign_res для res2
  sign_res3_data?: SignRes;       // Полный объект sign_res для res3
  sign_res4_data?: SignRes;       // Полный объект sign_res для res4
  sign_res5_data?: SignRes;       // Полный объект sign_res для res5
  sign_res6_data?: SignRes;       // Полный объект sign_res для res6
  sign_res7_data?: SignRes;       // Полный объект sign_res для res7
  name_res?: StringRes;           // Полный объект string_res для имени
  description_res?: StringRes;    // Полный объект string_res для описания

  // Массив всех связанных объектов SignRes для удобства
  all_sign_res?: SignRes[];

  show_x?: number;
  show_y?: number;
}

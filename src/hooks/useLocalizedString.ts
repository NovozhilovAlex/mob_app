// import { useAppSettingsStore } from '@/src/services/AppSettingsService';
//
// /**
//  * Хук для получения локализованных строк из базы данных
//  * Использует текущий язык из настроек приложения
//  */
// export function useLocalizedString() {
//   const { language } = useAppSettingsStore();
//
//   /**
//    * Получить локализованную строку из объекта с русским и английским вариантами
//    */
//   const getString = (
//     rusString?: string | null,
//     engString?: string | null
//   ): string => {
//     if (language === 'rus' && rusString) {
//       return rusString;
//     }
//     if (language === 'eng' && engString) {
//       return engString;
//     }
//     // Если нет строки для текущего языка, пробуем другой
//     if (rusString) return rusString;
//     if (engString) return engString;
//
//     return ''; // Пустая строка по умолчанию
//   };
//
//   /**
//    * Получить текст для кнопки/элемента интерфейса
//    */
//   const getUIText = (rusText: string, engText: string): string => {
//     return language === 'rus' ? rusText : engText;
//   };
//
//   /**
//    * Получить название модификации с учетом языка
//    */
//   const getModificationName = (rusName?: string, engName?: string, year?: number): string => {
//     const name = getString(rusName, engName);
//     if (year) {
//       return `${name} (${year})`;
//     }
//     return name;
//   };
//
//   /**
//    * Получить описание модификации с учетом языка
//    */
//   const getModificationDescription = (rusDesc?: string, engDesc?: string): string => {
//     return getString(rusDesc, engDesc);
//   };
//
//   return {
//     language,
//     getString,
//     getUIText,
//     getModificationName,
//     getModificationDescription,
//   };
// }

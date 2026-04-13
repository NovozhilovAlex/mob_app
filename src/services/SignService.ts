import { create } from 'zustand';
import { Sign } from '@/src';
import { dataCacheService } from "@/src/services/DataCacheService";

/**
 * Интерфейс состояния для хранилища знаков
 */
interface SignState {
  // Данные
  signs: Sign[];
  signsWithDetails: Sign[];
  currentSign: Sign | null;

  // Контекст текущей загрузки
  currentModificationId: number | null;

  // Состояние
  isLoading: boolean;
  error: string | null;

  // Действия
  loadSignsWithDetails: (modificationId: number) => Promise<void>;
  clearSigns: () => void;
  clearError: () => void;
  cancelPendingRequests: () => void;
}

/**
 * Хранилище Zustand для работы со знаками
 */
export const useSignStore = create<SignState>((set, get) => ({
  // Начальное состояние
  signs: [],
  signsWithDetails: [],
  currentSign: null,
  currentModificationId: null,
  isLoading: false,
  error: null,

  /**
   * Загрузить знаки с детальной информацией
   */
  loadSignsWithDetails: async (modificationId: number) => {
    const currentState = get();

    // Если уже загружаем для этой же модификации, пропускаем
    if (currentState.isLoading && currentState.currentModificationId === modificationId) {
      return;
    }

    set({
      isLoading: true,
      error: null,
      currentModificationId: modificationId,
    });

    try {
      // Проверяем, что кэш инициализирован
      if (!dataCacheService.isCacheInitialized()) {
        throw new Error('Кэш данных не инициализирован');
      }

      console.log(`🔄 Загрузка знаков для модификации ${modificationId}`);

      // Получаем знаки с полными данными из кэша
      const signs = dataCacheService.getSignsWithDetails(modificationId);

      console.log(`✅ Получено ${signs.length} знаков`);

      // Проверяем, что запрос еще актуален
      if (get().currentModificationId === modificationId) {
        set({
          signsWithDetails: signs, // Исправлено: было signs, должно быть signsWithDetails
          isLoading: false,
          currentModificationId: modificationId,
        });
      }
    } catch (error: any) {
      console.error(`❌ Ошибка загрузки знаков для модификации ${modificationId}:`, error);

      // Проверяем, что ошибка относится к текущей загрузке
      if (get().currentModificationId === modificationId) {
        set({
          error: error.message || 'Ошибка загрузки деталей знаков',
          isLoading: false
        });
      }
    }
  },

  /**
   * Очистить список знаков
   */
  clearSigns: () => {
    set({
      signs: [],
      signsWithDetails: [],
      currentSign: null,
      currentModificationId: null,
      isLoading: false,
      error: null
    });
  },

  /**
   * Отменить ожидающие запросы
   */
  cancelPendingRequests: () => {
    set({
      currentModificationId: null,
      isLoading: false
    });
  },

  /**
   * Очистить ошибку
   */
  clearError: () => {
    set({ error: null });
  },
}));

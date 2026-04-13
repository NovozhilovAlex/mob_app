import { create } from 'zustand';
import { Modification, ModificationWithDetails } from '@/src';
import {dataCacheService} from "@/src/services/DataCacheService";

/**
 * Интерфейс состояния для хранилища модификаций
 */
interface ModificationState {
  // Данные
  modifications: Modification[];
  modificationsWithDetails: ModificationWithDetails[];
  currentModification: ModificationWithDetails | null;

  // Состояние загрузки
  isLoading: boolean;
  error: string | null;

  // Действия (actions)
  loadAllModifications: () => Promise<void>;
  loadModificationsWithDetailsByModificationId: (modificationId: number) => Promise<void>;
  loadModificationById: (id: number) => Promise<void>;
  clearError: () => void;
}

/**
 * Хранилище Zustand для работы с модификациями
 */
export const useModificationStore = create<ModificationState>((set, get) => ({
  // Начальное состояние
  modifications: [],
  modificationsWithDetails: [],
  currentModification: null,
  isLoading: false,
  error: null,

  /**
   * Загрузить все модификации
   */
  loadAllModifications: async () => {
    set({ isLoading: true, error: null });

    try {
      // Проверяем, что кэш инициализирован
      if (!dataCacheService.isCacheInitialized()) {
        throw new Error('Кэш данных не инициализирован');
      }

      const cache = dataCacheService.getCache();
      set({ modifications: cache.modifications, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Ошибка загрузки модификаций',
        isLoading: false
      });
    }
  },

  /**
   * Загрузить модификации с деталями по номиналу
   */
  loadModificationsWithDetailsByModificationId: async (modificationId: number) => {
    set({ isLoading: true, error: null });

    try {
      // Проверяем, что кэш инициализирован
      if (!dataCacheService.isCacheInitialized()) {
        throw new Error('Кэш данных не инициализирован');
      }

      const cache = dataCacheService.getCache();

      const modification = cache.modificationsWithDetails.filter(m =>
        m.modification_id === modificationId
      );
      if (modification.length < 1){
        throw new Error('Модификация не найдена');
      }

      const modificationsWithDetails = cache.modificationsWithDetails.filter(m =>
        m.nominal_id === modification.at(0)?.nominal_id
      );

      set({ modificationsWithDetails, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Ошибка загрузки модификаций с деталями',
        isLoading: false
      });
    }
  },

  /**
   * Загрузить модификацию по ID с деталями
   */
  loadModificationById: async (id: number) => {
    set({ isLoading: true, error: null });

    try {
      // Проверяем, что кэш инициализирован
      if (!dataCacheService.isCacheInitialized()) {
        throw new Error('Кэш данных не инициализирован');
      }

      const cache = dataCacheService.getCache();
      const modification = cache.modificationsWithDetails.find(m =>
        m.modification_id === id
      );

      if (!modification) {
        throw new Error('Модификация не найдена');
      }

      set({ currentModification: modification, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Ошибка загрузки модификации',
        isLoading: false
      });
    }
  },

  /**
   * Очистить ошибку
   */
  clearError: () => {
    set({ error: null });
  },
}));

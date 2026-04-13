import { create } from 'zustand';
import { Nominal, NominalWithStats } from '@/src';
import {dataCacheService} from "@/src/services/DataCacheService";

/**
 * Интерфейс состояния для хранилища номиналов
 */
interface NominalState {
  // Данные
  nominals: Nominal[];
  nominalsWithStats: NominalWithStats[];
  currentNominal: Nominal | null;

  // Состояние
  isLoading: boolean;
  error: string | null;

  // Действия
  loadNominalsWithStats: () => Promise<void>;
  clearError: () => void;
}

/**
 * Хранилище Zustand для работы с номиналами
 */
export const useNominalStore = create<NominalState>((set, get) => ({
  // Начальное состояние
  nominals: [],
  nominalsWithStats: [],
  currentNominal: null,
  isLoading: false,
  error: null,

  /**
   * Загрузить номиналы со статистикой
   */
  loadNominalsWithStats: async () => {
    set({ isLoading: true, error: null });

    try {
      const cache = dataCacheService.getCache();
      const nominalsWithStats = cache.nominalsWithStats
      set({ nominalsWithStats, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Ошибка загрузки статистики номиналов',
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

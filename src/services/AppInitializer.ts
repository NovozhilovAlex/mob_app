import { databaseService } from '@/src/database/database';
import { dataCacheService } from './DataCacheService';

/**
 * Инициализатор приложения
 */
class AppInitializer {
  private static instance: AppInitializer;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  /**
   * Инициализация приложения
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('🚀 Инициализация приложения...');

        // 1. Инициализируем базу данных
        console.log('🔌 Подключение к базе данных...');
        await databaseService.initialize();

        // 2. Загружаем данные в кэш
        console.log('🔄 Загрузка данных в кэш...');
        await dataCacheService.initialize();

        this.isInitialized = true;
        console.log('✅ Приложение успешно инициализировано');
        resolve();
        this.initializationPromise = null;
      } catch (error) {
        console.error('❌ Ошибка инициализации приложения:', error);
        reject(error);
        this.initializationPromise = null;
      }
    });

    return this.initializationPromise;
  }
}

// Экспортируем синглтон
export const appInitializer = AppInitializer.getInstance();
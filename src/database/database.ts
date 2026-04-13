import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import {Directory, Paths, File} from "expo-file-system";

export interface QueryResult<T = any> {
  rows: T[];
  insertId?: number;
  rowsAffected: number;
}

/**
 * Сервис для работы с базой данных
 */
class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Инициализирует базу данных
   */
  async initialize(): Promise<SQLite.SQLiteDatabase> {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    try {
      console.log('🔌 Подключаемся к базе данных через expo-sqlite...');

      // 1. Загружаем ассет базы данных
      // const asset = Asset.fromModule(require('../../assets/database/bnkdb.db'));
      // await asset.downloadAsync();
      //
      // if (!asset.localUri) {
      //   throw new Error('Не удалось получить локальный путь к файлу базы данных');
      // }
      //
      // console.log('📁 Локальный путь к базе:', asset.localUri);

      const dbName = 'bnkdb.db';
      const dbAsset = require('../../assets/database/bnkdb.db');

      // 1. Копируем БД
      await this.setupDatabase(dbName, dbAsset);

      // 2. Открываем базу через expo-sqlite
      this.db = await SQLite.openDatabaseAsync(dbName);

      // 3. Проверяем соединение с базой
      await this.testConnection();

      this.isInitialized = true;
      console.log('✅ Подключение к базе данных успешно установлено');
      return this.db;
    } catch (error: any) {
      console.error('❌ Ошибка подключения к базе данных:', error);

      console.log('\n💡 ПОДСКАЗКА:');
      console.log('   Файл базы данных должен быть в папке assets');
      console.log('   Проверьте, что файл действительно там есть');

      throw new Error(`Не удалось подключиться к базе данных: ${error.message}`);
    }
  }


  async setupDatabase(dbName: string, dbAsset: any) {
    const dbDir = new Directory(Paths.document, 'SQLite');
    const dbFile = new File(dbDir, dbName);

    if (!dbDir.exists) {
      dbDir.create();
    }

    const asset = Asset.fromModule(dbAsset);
    await asset.downloadAsync();

    if (asset.localUri != null) {
      const sourceFile = new File(asset.localUri);

      if (dbFile.exists)
      {
        if (dbFile.md5 === sourceFile.md5){
          console.log('dbFile exists and md5 equals')
          return;
        }

        console.log('dbFile exists and md5 not equals')
        dbFile.delete();
      }
      else
      {
        console.log('dbFile not exists')
      }

      console.log('copy dbFile')
      sourceFile.copy(dbFile);
    }
  }


  /**
   * Тестовый запрос для проверки соединения
   */
  private async testConnection(): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');

    try {
      // Пробуем простой запрос
      const result = this.db.getAllSync('SELECT 1 as test');
      console.log('✅ Тестовый запрос выполнен:', result);

      // Пробуем посчитать таблицы
      const tablesResult = this.db.getAllSync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );

      console.log(`📊 Найдено таблиц: ${tablesResult.length}`);

      // Выводим список таблиц
      tablesResult.forEach((table, index: number) => {
        console.log(`   ${index + 1}. ${table.name}`);
      });

      // Показываем количество записей в основных таблицах
      await this.showTableStats();

    } catch (error) {
      console.error('❌ Ошибка проверки базы данных:', error);
      throw error;
    }
  }

  /**
   * Показать статистику по таблицам
   */
  private async showTableStats(): Promise<void> {
    const mainTables = ['modification', 'nominal', 'sign', 'picture', 'audio'];

    for (const table of mainTables) {
      try {
        const countResult = this.db!.getAllSync<{ count: number }>(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        // Исправлено: правильный доступ к свойству count
        const count = countResult.length > 0 ? countResult[0].count : 0;
        console.log(`   📈 ${table}: ${count} записей`);
      } catch (error) {
        // Таблица может не существовать
      }
    }
  }

  /**
   * Получить экземпляр базы данных
   */
  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      return this.initialize();
    }
    return this.db;
  }

  /**
   * Выполнить SQL запрос (асинхронная версия)
   */
  async executeQuery<T = any>(
    sql: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      // Используем правильный API expo-sqlite
      db.runAsync(sql, params)
        .then((result) => {
          // Для SELECT запросов нужно использовать getAllAsync
          if (sql.trim().toUpperCase().startsWith('SELECT')) {
            db.getAllAsync<T>(sql, params)
              .then((rows) => {
                resolve({
                  rows: rows || [],
                  insertId: undefined,
                  rowsAffected: 0,
                });
              })
              .catch(reject);
          } else {
            // Для INSERT, UPDATE, DELETE
            resolve({
              rows: [],
              insertId: result.lastInsertRowId,
              rowsAffected: result.changes,
            });
          }
        })
        .catch(reject);
    });
  }
}

// Экспортируем синглтон
export const databaseService = DatabaseService.getInstance();

// Константы для таблиц
export const TABLE_NAMES = {
  AUDIO: 'audio',
  MODIFICATION: 'modification',
  NOMINAL: 'nominal',
  PICTURE: 'picture',
  SIGN: 'sign',
  SIGN_RES: 'sign_res',
  SIGN_TYPE: 'sign_type',
  STRING_RES: 'string_res',
  STRING_TO_AUDIO: 'string_to_audio',
} as const;

export type TableName = keyof typeof TABLE_NAMES;
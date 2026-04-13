import { databaseService, TABLE_NAMES } from '@/src/database/database';
import {
  Audio,
  Modification,
  ModificationWithDetails, ModificationWithFullDetails,
  Nominal,
  NominalWithStats,
  Picture,
  Sign, SignRes, SignType, StringRes, StringToAudio,
} from '@/src';

/**
 * Интерфейс для кэшированных данных
 */
interface CachedData {
  // Основные таблицы
  nominals: Nominal[];
  modifications: Modification[];
  signs: Sign[];
  pictures: Picture[];
  audios: Audio[];

  // Дополнительные таблицы
  signRes: SignRes[];
  stringRes: StringRes[];
  signTypes: SignType[];
  stringToAudio: StringToAudio[];

  // Предварительно рассчитанные данные
  nominalsWithStats: NominalWithStats[];
  modificationsWithDetails: ModificationWithDetails[];
  signsWithDetailsCache: Map<string, Sign[]>;

  // Добавляем кэш для модификации
  modificationByIdCache: Map<number, Modification>;

  // Добавляем кэш для группированных картинок
  picturesByModificationCache: Map<number, { obverse?: Picture; reverse?: Picture }>;
  // Добавляем кэш для модификаций по номиналу
  modificationsByNominalCache: Map<number, Modification[]>;
}

/**
 * Сервис кэширования данных
 */
class DataCacheService {
  private cache: CachedData | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<CachedData> | null = null;

  /**
   * Получить модификации по ID номинала
   */
  getModificationsByNominalId(nominalId: number): Modification[] {
    if (!this.cache) {
      throw new Error('Кэш не инициализирован');
    }

    // Проверяем кэш
    if (this.cache.modificationsByNominalCache.has(nominalId)) {
      return this.cache.modificationsByNominalCache.get(nominalId)!;
    }

    // Фильтруем модификации по номиналу
    const modifications = this.cache.modifications.filter(
      mod => mod.nominal_id === nominalId
    );

    // Сохраняем в кэш
    this.cache.modificationsByNominalCache.set(nominalId, modifications);

    return modifications;
  }

  // Добавить метод для получения группированных картинок
  getPicturesByModification(modificationId: number): { obverse?: Picture; reverse?: Picture } {
    if (!this.cache) {
      throw new Error('Кэш не инициализирован');
    }

    // Проверяем кэш
    if (this.cache.picturesByModificationCache.has(modificationId)) {
      return this.cache.picturesByModificationCache.get(modificationId)!;
    }

    // Получаем картики для модификации
    const modificationPictures = this.cache.pictures.filter(p =>
      p.modification_id === modificationId
    );

    const result: { obverse?: Picture; reverse?: Picture } = {};

    modificationPictures.forEach(picture => {
      // Если есть pic_a - это аверс
      if (picture.pic_a) {
        result.obverse = picture;
      }
      // Если есть pic_r - это реверс
      if (picture.pic_r) {
        result.reverse = picture;
      }
    });

    // Сохраняем в кэш
    this.cache.picturesByModificationCache.set(modificationId, result);

    return result;
  }


  /**
   * Получить модификацию по ID
   */
  getModificationById(modificationId: number): Modification {
    if (!this.cache) {
      throw new Error('Кэш не инициализирован');
    }

    // Проверяем кэш
    if (this.cache.modificationByIdCache.has(modificationId)) {
      return this.cache.modificationByIdCache.get(modificationId)!;
    }

    // Фильтруем модификации по номиналу
    const modifications = this.cache.modifications.filter(
      mod => mod.modification_id === modificationId
    );
    const modification = modifications[0];

    // Сохраняем в кэш
    this.cache.modificationByIdCache.set(modificationId, modification);

    return modification;
  }



  /**
   * Инициализация кэша
   */
  async initialize(): Promise<CachedData> {
    if (this.isInitialized && this.cache) {
      return this.cache;
    }

    // Если уже идет загрузка, возвращаем существующий промис
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise(async (resolve, reject) => {
      try {
        const db = await databaseService.getDatabase();

        // Вспомогательная функция для загрузки таблицы
        const loadTable = async <T>(tableName: string, mapper: (row: any) => T): Promise<T[]> => {
          try {
            const sql = `SELECT * FROM ${tableName}`;
            const result = await db.getAllAsync<any>(sql);
            console.log(`✅ Таблица ${tableName} загружена: ${result.length} записей`);
            return result.map(mapper);
          } catch (error) {
            console.error(`❌ Ошибка загрузки таблицы ${tableName}:`, error);
            return [];
          }
        };

        // Загружаем все таблицы последовательно (чтобы видеть прогресс)
        const nominals = await loadTable<Nominal>(TABLE_NAMES.NOMINAL, (row) => ({
          nominal_id: row.nominal_id,
          nominal_value: row.nominal_value,
        }));

        const modifications = await loadTable<Modification>(TABLE_NAMES.MODIFICATION, (row) => ({
          modification_id: row.modification_id,
          nominal_id: row.nominal_id,
          modification_year: row.modification_year,
          modification_polymer: Boolean(row.modification_polymer),
          modification_fullname: row.modification_fullname,
          modification_description: row.modification_description,
          bnk_size_width: row.bnk_size_width,
          bnk_size_height: row.bnk_size_height,
        }));

        const signs = await loadTable<Sign>(TABLE_NAMES.SIGN, (row) => ({
          sign_id: row.sign_id,
          sign_type_id: row.sign_type_id,
          modification_id: row.modification_id,
          sign_side: row.sign_side || 1,
          sign_x: row.sign_x,
          sign_y: row.sign_y,
          sign_min_x: row.sign_min_x,
          sign_min_y: row.sign_min_y,
          sign_max_x: row.sign_max_x,
          sign_max_y: row.sign_max_y,
          sign_name_str: row.sign_name_str,
          sign_name: row.sign_name,
          sign_description: row.sign_description,
          sign_show_type: row.sign_show_type,
          sign_res1: row.sign_res1,
          sign_res2: row.sign_res2,
          sign_res3: row.sign_res3,
          sign_res4: row.sign_res4,
          sign_res5: row.sign_res5,
          sign_res6: row.sign_res6,
          sign_res7: row.sign_res7,
          sign_view_rotate_angle: row.sign_view_rotate_angle,
          sign_loupe_scale_value: row.sign_loupe_scale_value,
          sign_scale_value: row.sign_scale_value,
          is_hide: row.is_hide || 0,
          show_x: row.show_x || 0,
          show_y: row.show_y || 0,
        }));

        const pictures = await loadTable<Picture>(TABLE_NAMES.PICTURE, (row) => ({
          pic_id: row.pic_id,
          modification_id: row.modification_id,
          pic_light_code: row.pic_light_code,
          pic_a: row.pic_a,
          pic_r: row.pic_r,
          pic_a_transparentmask: row.pic_a_transparentmask,
          pic_r_transparentmask: row.pic_r_transparentmask,
          sign_scale: row.sign_scale,
        }));

        const audios = await loadTable<Audio>(TABLE_NAMES.AUDIO, (row) => ({
          audio_id: row.audio_id,
          audio_path: row.audio_path || '',
          comment: row.comment,
        }));

        // ВАЖНО: Загружаем полные объекты SignRes
        const signRes = await loadTable<SignRes>(TABLE_NAMES.SIGN_RES, (row) => ({
          sign_res_id: row.sign_res_id,
          res_path: row.res_path,
          pos_x: row.pos_x,
          pos_y: row.pos_y,
          pos_z: row.pos_z,
          width: row.width,
          height: row.height,
          scale_x: row.scale_x,
          scale_y: row.scale_y,
          scale_z: row.scale_z,
          move_min_x: row.move_min_x,
          move_min_y: row.move_min_y,
          move_max_x: row.move_max_x,
          move_max_y: row.move_max_y,
          pivot_x: row.pivot_x,
          pivot_y: row.pivot_y,
          layer: row.layer,
        }));

        const stringRes = await loadTable<StringRes>(TABLE_NAMES.STRING_RES, (row) => ({
          id: row.id,
          rus_string: row.rus_string || '',
          eng_string: row.eng_string || '',
        }));

        const signTypes = await loadTable<SignType>(TABLE_NAMES.SIGN_TYPE, (row) => ({
          sign_type_id: row.sign_type_id,
          sign_type_code: row.sign_type_code || '',
          sign_type_description: row.sign_type_description || '',
        }));

        const stringToAudio = await loadTable<StringToAudio>(TABLE_NAMES.STRING_TO_AUDIO, (row) => ({
          id: row.id,
          id_string: row.id_string,
          id_audio: row.id_audio,
          order: row.order,
          language: row.language,
          comment: row.comment,
        }));

        // Предварительно рассчитываем данные
        const nominalsWithStats = this.calculateNominalsWithStats(nominals, modifications);
        const modificationsWithDetails = this.calculateModificationsWithDetails(modifications, nominals, stringRes);

        this.cache = {
          nominals,
          modifications,
          signs,
          pictures,
          audios,
          signRes,
          stringRes,
          signTypes,
          nominalsWithStats,
          modificationsWithDetails,
          stringToAudio,
          signsWithDetailsCache: new Map(),
          picturesByModificationCache: new Map(),
          modificationsByNominalCache: new Map(),
          modificationByIdCache: new Map(),
        };

        this.isInitialized = true;
        console.log(`✅ Кэш загружен: ${modifications.length} модификаций, ${signs.length} знаков`);
        console.log(`✅ SignRes: ${signRes.length} записей`);
        console.log(`✅ StringRes: ${stringRes.length} записей`);
        console.log(`✅ SignTypes: ${signTypes.length} записей`);

        // Отладка: покажем несколько знаков
        if (signs.length > 0) {
          console.log('🔍 Пример знака:', {
            id: signs[0].sign_id,
            type_id: signs[0].sign_type_id,
            name_id: signs[0].sign_name,
            desc_id: signs[0].sign_description,
            res1: signs[0].sign_res1,
            modification_id: signs[0].modification_id,
          });
        }

        resolve(this.cache);
        this.initializationPromise = null;
      } catch (error) {
        console.error('❌ Ошибка загрузки кэша:', error);
        this.initializationPromise = null;
        reject(error);
      }
    });

    return this.initializationPromise;
  }

  /**
   * Рассчитать номиналы со статистикой
   */
  private calculateNominalsWithStats(
    nominals: Nominal[],
    modifications: Modification[]
  ): NominalWithStats[] {
    // Группируем модификации по номиналу
    const modsByNominal = new Map<number, Modification[]>();
    modifications.forEach(mod => {
      if (mod.nominal_id) {
        const list = modsByNominal.get(mod.nominal_id) || [];
        list.push(mod);
        modsByNominal.set(mod.nominal_id, list);
      }
    });

    return nominals.map(nominal => {
      const mods = modsByNominal.get(nominal.nominal_id) || [];
      const years = Array.from(
        new Set(mods.map(m => m.modification_year).filter((year): year is number => year !== undefined))
      ).sort((a, b) => a - b);

      return {
        ...nominal,
        modification_count: mods.length,
        years: years.length > 0 ? years.join(', ') : undefined,
      };
    }).sort((a, b) => a.nominal_value - b.nominal_value);
  }

  /**
   * Рассчитать модификации с деталями
   */
  private calculateModificationsWithDetails(
    modifications: Modification[],
    nominals: Nominal[],
    stringRes: StringRes[]
  ): ModificationWithDetails[] {
    const nominalMap = new Map<number, number>();
    nominals.forEach(n => nominalMap.set(n.nominal_id, n.nominal_value));

    const stringResMap = new Map<number, { rus: string; eng: string }>();
    stringRes.forEach(s => stringResMap.set(s.id, { rus: s.rus_string, eng: s.eng_string }));

    return modifications.map(mod => {
      const nominalValue = nominalMap.get(mod.nominal_id!);
      const fullname = mod.modification_fullname ? stringResMap.get(mod.modification_fullname) : undefined;
      const description = mod.modification_description ? stringResMap.get(mod.modification_description) : undefined;

      return {
        ...mod,
        nominal_value: nominalValue,
        fullname_rus: fullname?.rus,
        fullname_eng: fullname?.eng,
        description_rus: description?.rus,
        description_eng: description?.eng,
      };
    });
  }

  /**
   * Получить знаки с деталями
   */
  getSignsWithDetails(modificationId: number): Sign[] {
    if (!this.cache) {
      throw new Error('Кэш не инициализирован');
    }

    const cacheKey = `signs_full_${modificationId}`;

    // Проверяем кэш (если уже загружены для этой модификации)
    if (this.cache.signsWithDetailsCache.has(cacheKey)) {
      console.log(`📦 Используем кэш для модификации ${modificationId}`);
      return this.cache.signsWithDetailsCache.get(cacheKey)!;
    }

    console.log(`🔍 Получаем знаки для модификации ${modificationId}`);

    // Получаем знаки для модификации (не скрытые)
    const signs = this.cache.signs.filter(s =>
      s.modification_id === modificationId
    );

    console.log(`📊 Найдено ${signs.length} знаков для модификации ${modificationId}`);

    // Если нет знаков, возвращаем пустой массив и кэшируем
    if (signs.length === 0) {
      this.cache.signsWithDetailsCache.set(cacheKey, []);
      return [];
    }

    // Создаем карты для быстрого поиска данных из связанных таблиц
    const signTypesMap = new Map<number, SignType>();
    const stringResMap = new Map<number, StringRes>();
    const signResMap = new Map<number, SignRes>();

    // Заполняем мапы данными из кэша
    this.cache.signTypes.forEach(st => signTypesMap.set(st.sign_type_id, st));
    this.cache.stringRes.forEach(sr => stringResMap.set(sr.id, sr));
    this.cache.signRes.forEach(sr => signResMap.set(sr.sign_res_id, sr));

    // Отладка
    console.log(`📋 SignTypes в мапе: ${signTypesMap.size}`);
    console.log(`📋 StringRes в мапе: ${stringResMap.size}`);
    console.log(`📋 SignRes в мапе: ${signResMap.size}`);

    // Формируем полные объекты Sign с вложенными данными
    const result: Sign[] = signs.map(sign => {
      const fullSign: Sign = { ...sign };

      // Отладка текущего знака
      console.log(`🔍 Обработка знака ${sign.sign_id}:`, {
        type_id: sign.sign_type_id,
        name_id: sign.sign_name,
        desc_id: sign.sign_description,
        res1: sign.sign_res1,
      });

      // Добавляем полный объект sign_type
      if (sign.sign_type_id && signTypesMap.has(sign.sign_type_id)) {
        fullSign.sign_type = signTypesMap.get(sign.sign_type_id);
        console.log(`   ✅ Найден тип знака: ${fullSign.sign_type?.sign_type_code}`);
      } else {
        console.log(`   ❌ Тип знака не найден для ID: ${sign.sign_type_id}`);
      }

      // Добавляем полные объекты string_res для имени и описания
      if (sign.sign_name && stringResMap.has(sign.sign_name)) {
        fullSign.name_res = stringResMap.get(sign.sign_name);
        console.log(`   ✅ Найдено название: ${fullSign.name_res?.rus_string}`);
      } else {
        console.log(`   ❌ Название не найдено для ID: ${sign.sign_name}`);
      }

      if (sign.sign_description && stringResMap.has(sign.sign_description)) {
        fullSign.description_res = stringResMap.get(sign.sign_description);
        console.log(`   ✅ Найдено описание: ${fullSign.description_res?.rus_string?.substring(0, 50)}...`);
      } else {
        console.log(`   ❌ Описание не найдено для ID: ${sign.sign_description}`);
      }

      // Добавляем полные объекты sign_res для каждого ресурса
      const resFields = ['sign_res1', 'sign_res2', 'sign_res3', 'sign_res4',
        'sign_res5', 'sign_res6', 'sign_res7'] as const;

      const allResObjects: SignRes[] = [];

      resFields.forEach((field, index) => {
        const resId = sign[field];
        if (resId && signResMap.has(resId)) {
          const resObject = signResMap.get(resId)!;

          // Динамически добавляем поле с полным объектом
          (fullSign as any)[`${field}_data`] = resObject;
          allResObjects.push(resObject);

          console.log(`   ✅ Найден ресурс ${field}: ${resObject.res_path}`);
        } else if (resId) {
          console.log(`   ❌ Ресурс ${field} не найден для ID: ${resId}`);
        }
      });

      // Добавляем массив всех связанных объектов SignRes
      if (allResObjects.length > 0) {
        fullSign.all_sign_res = allResObjects;
      }

      return fullSign;
    });

    console.log(`✅ Сформировано ${result.length} знаков с деталями`);

    // Сохраняем в кэш
    this.cache.signsWithDetailsCache.set(cacheKey, result);

    return result;
  }

  /**
   * Получить аудио для строки
   */
  getAudioForString(stringId: number): Audio[] {
    if (!this.cache) return [];

    const links = this.cache.stringToAudio.filter(
      link => link.id_string === stringId
    );

    return links
      .map(link => this.cache!.audios.find(audio => audio.audio_id === link.id_audio))
      .filter((audio): audio is Audio => audio !== undefined)
      .sort((a, b) => {
        const linkA = links.find(link => link.id_audio === a.audio_id);
        const linkB = links.find(link => link.id_audio === b.audio_id);
        return (linkA?.order || 0) - (linkB?.order || 0);
      });
  }

  /**
   * Получить модификацию с полными данными включая аудио
   */
  getModificationWithFullDetails(modificationId: number): ModificationWithFullDetails | null {
    const mod = this.cache!.modificationsWithDetails.find(
      m => m.modification_id === modificationId
    );

    if (!mod) return null;

    const fullnameAudio = mod.modification_fullname
      ? this.getAudioForString(mod.modification_fullname)
      : [];

    const descriptionAudio = mod.modification_description
      ? this.getAudioForString(mod.modification_description)
      : [];

    return {
      ...mod,
      fullname_audio: fullnameAudio,
      description_audio: descriptionAudio,
    };
  }

  /**
   * Получить кэш
   */
  getCache(): CachedData {
    if (!this.cache) {
      throw new Error('Кэш не инициализирован. Сначала вызовите initialize()');
    }
    return this.cache;
  }

  /**
   * Проверить инициализацию
   */
  isCacheInitialized(): boolean {
    return this.isInitialized;
  }
}

// Экспортируем синглтон
export const dataCacheService = new DataCacheService();

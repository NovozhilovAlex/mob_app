#include <jni.h>
#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>
#include <android/log.h>

#define LOG_TAG "JNI_RectDetector"  // Уникальный тег
#define LOGV(...)  __android_log_print(ANDROID_LOG_VERBOSE, LOG_TAG, __VA_ARGS__)
#define LOGD(...)  __android_log_print(ANDROID_LOG_DEBUG,    LOG_TAG, __VA_ARGS__)
#define LOGI(...)  __android_log_print(ANDROID_LOG_INFO,     LOG_TAG, __VA_ARGS__)
#define LOGW(...)  __android_log_print(ANDROID_LOG_WARN,     LOG_TAG, __VA_ARGS__)
#define LOGE(...)  __android_log_print(ANDROID_LOG_ERROR,    LOG_TAG, __VA_ARGS__)

static void* libSignCheckHandle = nullptr;

extern "C" JNIEXPORT void JNICALL
Java_ru_cbr_banknotesrf_LibHolder_initLibArNative(JNIEnv* env, jobject thiz) {
    // Загружаем libSignCheckCpp.so
    if (!libSignCheckHandle) {
        libSignCheckHandle = dlopen("libSignCheckCpp.so", RTLD_LAZY);
        if (!libSignCheckHandle) {
            return;
        }
    }

    using InitFunc = void(*)();
    InitFunc initLibAR = (InitFunc)dlsym(libSignCheckHandle, "initLibAR");
    if (initLibAR) {
        initLibAR();
    }
}

extern "C" JNIEXPORT void JNICALL
Java_ru_cbr_banknotesrf_LibHolder_setPersistentDataPathNative(JNIEnv* env, jobject thiz, jstring path_) {
    if (!libSignCheckHandle) {
        libSignCheckHandle = dlopen("libSignCheckCpp.so", RTLD_LAZY);
        if (!libSignCheckHandle) {
            return;
        }
    }

    // Преобразование строки path
    const char* path_cstr = env->GetStringUTFChars(path_, nullptr);
    if (path_cstr == nullptr) {
        return;
    }

    using SetPersistentDataPathFunc = void(*)(char*);
    SetPersistentDataPathFunc setPersistentDataPath = (SetPersistentDataPathFunc)dlsym(libSignCheckHandle, "setPersistentDataPath");
    if (setPersistentDataPath) {
        setPersistentDataPath(const_cast<char*>(path_cstr));
    }
}

extern "C" JNIEXPORT void JNICALL
Java_ru_cbr_banknotesrf_LibHolder_addTargetNative(JNIEnv* env, jobject thiz, jbyteArray buffer_, jint length) {
    if (!libSignCheckHandle) {
        libSignCheckHandle = dlopen("libSignCheckCpp.so", RTLD_LAZY);
        if (!libSignCheckHandle) {
            return;
        }
    }

    // 1. Получаем указатель на данные из jbyteArray
    // isCopy = JNI_FALSE означает, что мы работаем с оригинальным буфером (если возможно)
    jbyte* buffer_ptr = env->GetByteArrayElements(buffer_, JNI_FALSE);

    if (buffer_ptr == nullptr) {
        return;
    }

    // 2. Находим нужную функцию в загруженной библиотеке
    using AddTargetFunc = void(*)(unsigned char*, int);
    AddTargetFunc addTarget = (AddTargetFunc)dlsym(libSignCheckHandle, "addTarget");

    if (addTarget) {
        // 3. Вызываем нативную функцию
        // unsigned char* в C++ соответствует jbyte* в JNI (или char*).
        addTarget(reinterpret_cast<unsigned char*>(buffer_ptr), length);
    }

    // 4. Освобождаем буфер JNI
    env->ReleaseByteArrayElements(buffer_, buffer_ptr, JNI_ABORT);
    // JNI_ABORT используется, потому что мы не вносили изменений в буфер,
    // и нет необходимости копировать изменения обратно в Java-массив.
}

extern "C" JNIEXPORT void JNICALL
Java_ru_cbr_banknotesrf_LibHolder_initNetRectDataMatrixNative(JNIEnv* env, jobject thiz, jbyteArray buffer_, jint length) {
    if (!libSignCheckHandle) {
        libSignCheckHandle = dlopen("libSignCheckCpp.so", RTLD_LAZY);
        if (!libSignCheckHandle) {
            return;
        }
    }
    jbyte* buffer_ptr = env->GetByteArrayElements(buffer_, JNI_FALSE);

    if (buffer_ptr == nullptr) {
        return;
    }

    using InitNetRectDataMatrixFunc = void(*)(unsigned char*, int);
    InitNetRectDataMatrixFunc initNetRectDataMatrix = (InitNetRectDataMatrixFunc)dlsym(libSignCheckHandle, "initNetRectDataMatrix");

    if (initNetRectDataMatrix) {
        initNetRectDataMatrix(reinterpret_cast<unsigned char*>(buffer_ptr), length);
    }

    env->ReleaseByteArrayElements(buffer_, buffer_ptr, JNI_ABORT);
}

extern "C" JNIEXPORT void JNICALL
Java_ru_cbr_banknotesrf_LibHolder_initNetClassifyDataMatrixNative(JNIEnv* env, jobject thiz, jbyteArray buffer_, jint length) {
    if (!libSignCheckHandle) {
        libSignCheckHandle = dlopen("libSignCheckCpp.so", RTLD_LAZY);
        if (!libSignCheckHandle) {
            return;
        }
    }
    jbyte* buffer_ptr = env->GetByteArrayElements(buffer_, JNI_FALSE);

    if (buffer_ptr == nullptr) {
        return;
    }

    using InitNetClassifyDataMatrixFunc = void(*)(unsigned char*, int);
    InitNetClassifyDataMatrixFunc initNetClassifyDataMatrix = (InitNetClassifyDataMatrixFunc)dlsym(libSignCheckHandle, "initNetClassifyDataMatrix");

    if (initNetClassifyDataMatrix) {
        initNetClassifyDataMatrix(reinterpret_cast<unsigned char*>(buffer_ptr), length);
    }

    env->ReleaseByteArrayElements(buffer_, buffer_ptr, JNI_ABORT);
}

extern "C" JNIEXPORT void JNICALL
Java_ru_cbr_banknotesrf_LibHolder_initSpark5k23Native(JNIEnv* env, jobject thiz, jbyteArray buffer_, jint length) {
    if (!libSignCheckHandle) {
        libSignCheckHandle = dlopen("libSignCheckCpp.so", RTLD_LAZY);
        if (!libSignCheckHandle) {
            return;
        }
    }
    jbyte* buffer_ptr = env->GetByteArrayElements(buffer_, JNI_FALSE);

    if (buffer_ptr == nullptr) {
        return;
    }

    using InitSpark5k23Func = void(*)(unsigned char*, int);
    InitSpark5k23Func initSpark5k23 = (InitSpark5k23Func)dlsym(libSignCheckHandle, "initFakeRecognitionNewSpark");

    if (initSpark5k23) {
        initSpark5k23(reinterpret_cast<unsigned char*>(buffer_ptr), length);
    }

    env->ReleaseByteArrayElements(buffer_, buffer_ptr, JNI_ABORT);
}

extern "C" JNIEXPORT void JNICALL
Java_ru_cbr_banknotesrf_LibHolderPlugin_getRectDataMatrixAndPointsClassesScoresNative(
        JNIEnv* env, jobject thiz,
        jbyteArray buffer_, jint width, jint height, jint channels,
        jboolean isRotated, jint pixelFormat, jstring path_, jint bufferSize,
        jobject holder_obj)
{
    if (!libSignCheckHandle) {
        libSignCheckHandle = dlopen("libSignCheckCpp.so", RTLD_LAZY);
        if (!libSignCheckHandle) {
            return;
        }
    }

    LOGD("🔥 1");

    // 1. Получаем указатель на данные буфера изображения
    jbyte* buffer_ptr = env->GetByteArrayElements(buffer_, JNI_FALSE);
    if (buffer_ptr == nullptr) {
        return;
    }

    LOGD("🔥 2");

    // 2. Преобразование строки path
    const char* path_cstr = env->GetStringUTFChars(path_, nullptr);
    if (path_cstr == nullptr) {
        env->ReleaseByteArrayElements(buffer_, buffer_ptr, JNI_ABORT);
        return;
    }

    LOGD("🔥 3");

    // --- Подготовка переменных для возврата из DLL ---
    unsigned char* points_data = nullptr;
    int length_val = 0; // Длина для points
    unsigned char* classes_data = nullptr;
    unsigned char* scores_data = nullptr;
    int targetId_val = -1;

    LOGD("🔥 4");

    // 3. Находим нужную функцию
    using GetRectDataFunc = void(*)(unsigned char*, int, int, int, unsigned char**, int*, unsigned char**, unsigned char**, bool, int, char*, int, int*);
    GetRectDataFunc getRectData = (GetRectDataFunc)dlsym(libSignCheckHandle, "getRectDataMatrixAndPointsClassesScores");

    LOGD("🔥 5");

    if (getRectData) {
        // 4. Вызываем нативную функцию
        getRectData(
                reinterpret_cast<unsigned char*>(buffer_ptr),
                width, height, channels,
                &points_data, &length_val, &classes_data, &scores_data,
                isRotated, pixelFormat,
                const_cast<char*>(path_cstr), bufferSize, &targetId_val
        );

        // 🔥 ЛОГИРОВАНИЕ РЕЗУЛЬТАТОВ
        LOGD("🔥 6: length_val=%d, targetId_val=%d", length_val, targetId_val);

        // 5. Получаем классы полей из Java объекта RectDataHolder
        jclass holderClass = env->GetObjectClass(holder_obj);
        if (!holderClass) goto cleanup;

        LOGD("🔥 7");

        // --- Работа с targetId ---
        jfieldID targetIdField = env->GetFieldID(holderClass, "targetId", "I");
        if (targetIdField) {
            env->SetIntField(holder_obj, targetIdField, targetId_val);
        }

        LOGD("🔥 8");

        // --- Работа с pointsArray (Длина = length_val) ---
        if (points_data && length_val > 0) {
            jfieldID pointsField = env->GetFieldID(holderClass, "pointsArray", "[B");
            if (pointsField) {
                jbyteArray points_jarray = env->NewByteArray(length_val);
                if (points_jarray) {
                    env->SetByteArrayRegion(points_jarray, 0, length_val, reinterpret_cast<jbyte*>(points_data));
                    env->SetObjectField(holder_obj, pointsField, points_jarray);

                    // Освобождаем память, выделенную DLL
                    free(points_data);
                }
            }
        }

        LOGD("🔥 9");

        // --- Работа с classesArray (Длина = length_val / 4) ---
        int classes_len = length_val / 4;
        if (classes_data && classes_len > 0) {
            jfieldID classesField = env->GetFieldID(holderClass, "classesArray", "[B");
            if (classesField) {
                jbyteArray classes_jarray = env->NewByteArray(classes_len);
                if (classes_jarray) {
                    env->SetByteArrayRegion(classes_jarray, 0, classes_len, reinterpret_cast<jbyte*>(classes_data));
                    env->SetObjectField(holder_obj, classesField, classes_jarray);

                    // Освобождаем память, выделенную DLL
                    free(classes_data);
                }
            }
        }

        LOGD("🔥 10");

        // --- Работа с scoresArray (Длина = length_val / 4) ---
        int scores_len = length_val / 4;
        if (scores_data && scores_len > 0) {
            jfieldID scoresField = env->GetFieldID(holderClass, "scoresArray", "[B");
            if (scoresField) {
                jbyteArray scores_jarray = env->NewByteArray(scores_len);
                if (scores_jarray) {
                    env->SetByteArrayRegion(scores_jarray, 0, scores_len, reinterpret_cast<jbyte*>(scores_data));
                    env->SetObjectField(holder_obj, scoresField, scores_jarray);

                    // Освобождаем память, выделенную DLL
                    free(scores_data);
                }
            }
        }

        LOGD("🔥 11");

    }
    cleanup:
    // 7. Освобождение ресурсов JNI
    env->ReleaseByteArrayElements(buffer_, buffer_ptr, JNI_ABORT);
    env->ReleaseStringUTFChars(path_, path_cstr);

    LOGD("🔥 12");
}

extern "C" JNIEXPORT void JNICALL
Java_ru_cbr_banknotesrf_LibHolder_checkSignNative(
        JNIEnv* env, jobject thiz,
        jbyteArray bufferTop_, jint widthTop, jint heightTop, jint channelsTop,
        jbyteArray bufferBot_, jint widthBot, jint heightBot, jint channelsBot,
        jstring bnkType_, jboolean isRotatedTop, jint pixelFormat, jstring path_,
        jint bufferSizeTop, jint bufferSizeBot, jboolean isRotatedBot,
        jobject holder_obj)
{
    if (!libSignCheckHandle) {
        libSignCheckHandle = dlopen("libSignCheckCpp.so", RTLD_LAZY);
        if (!libSignCheckHandle) {
            return;
        }
    }

    LOGD("⚡ 1");

    // 1. Получаем указатели на данные буферов изображений
    jbyte* bufferTop_ptr = env->GetByteArrayElements(bufferTop_, JNI_FALSE);
    if (bufferTop_ptr == nullptr) {
        return;
    }

    jbyte* bufferBot_ptr = env->GetByteArrayElements(bufferBot_, JNI_FALSE);
    if (bufferBot_ptr == nullptr) {
        env->ReleaseByteArrayElements(bufferTop_, bufferTop_ptr, JNI_ABORT);
        return;
    }

    LOGD("⚡ 2");

    // 2. Преобразование строк
    const char* bnkType_cstr = env->GetStringUTFChars(bnkType_, nullptr);
    if (bnkType_cstr == nullptr) {
        env->ReleaseByteArrayElements(bufferTop_, bufferTop_ptr, JNI_ABORT);
        env->ReleaseByteArrayElements(bufferBot_, bufferBot_ptr, JNI_ABORT);
        return;
    }

    const char* path_cstr = env->GetStringUTFChars(path_, nullptr);
    if (path_cstr == nullptr) {
        env->ReleaseStringUTFChars(bnkType_, bnkType_cstr);
        env->ReleaseByteArrayElements(bufferTop_, bufferTop_ptr, JNI_ABORT);
        env->ReleaseByteArrayElements(bufferBot_, bufferBot_ptr, JNI_ABORT);
        return;
    }

    LOGD("⚡ 3");

    // --- Подготовка переменных для возврата из DLL ---
    float bwcoef_val = 0.0f;
    int microelsCount_val = 0;
    unsigned char* patternVect_data = nullptr;
    unsigned char* waveAtomVect_data = nullptr;
    float sparkVal1_val = 0.0f;
    float sparkVal2_val = 0.0f;
    int sparkBnk5000_23_val = -1;
    int result_val = -2;

    LOGD("⚡ 4");

    // 3. Находим нужную функцию
    using CheckSignFunc = void(*)(unsigned char*, int, int, int, unsigned char*, int, int, int, char*, float*, int*, unsigned char**, unsigned char**, float*, float*, bool, int, char*, int, int, bool, int*, int*);  // 🔥 Добавлен int* в конце
    CheckSignFunc checkSign = (CheckSignFunc)dlsym(libSignCheckHandle, "checkSign");

    LOGD("⚡ 5");

    if (checkSign) {
        // 4. Вызываем нативную функцию
        checkSign(
                reinterpret_cast<unsigned char*>(bufferTop_ptr), widthTop, heightTop, channelsTop,
                reinterpret_cast<unsigned char*>(bufferBot_ptr), widthBot, heightBot, channelsBot,
                const_cast<char*>(bnkType_cstr), &bwcoef_val, &microelsCount_val,
                &patternVect_data, &waveAtomVect_data, &sparkVal1_val, &sparkVal2_val,
                isRotatedTop, pixelFormat, const_cast<char*>(path_cstr),
                bufferSizeTop, bufferSizeBot, isRotatedBot, &sparkBnk5000_23_val,
                &result_val
        );

        LOGD("⚡ 6: bwcoef=%.3f, microels=%d, spark1=%.3f, spark2=%.3f, sparkBnk=%d, result=%d",
             bwcoef_val, microelsCount_val, sparkVal1_val, sparkVal2_val, sparkBnk5000_23_val, result_val);

        // 5. Получаем классы полей из Java объекта SignCheckHolder
        jclass holderClass = env->GetObjectClass(holder_obj);
        if (!holderClass) goto cleanup;

        LOGD("⚡ 7");

        // --- Работа с простыми полями ---
        jfieldID bwcoefField = env->GetFieldID(holderClass, "bwcoef", "F");
        if (bwcoefField) {
            env->SetFloatField(holder_obj, bwcoefField, bwcoef_val);
        }

        jfieldID microelsCountField = env->GetFieldID(holderClass, "microelsCount", "I");
        if (microelsCountField) {
            env->SetIntField(holder_obj, microelsCountField, microelsCount_val);
        }

        jfieldID sparkVal1Field = env->GetFieldID(holderClass, "sparkVal1", "F");
        if (sparkVal1Field) {
            env->SetFloatField(holder_obj, sparkVal1Field, sparkVal1_val);
        }

        jfieldID sparkVal2Field = env->GetFieldID(holderClass, "sparkVal2", "F");
        if (sparkVal2Field) {
            env->SetFloatField(holder_obj, sparkVal2Field, sparkVal2_val);
        }

        jfieldID sparkBnkField = env->GetFieldID(holderClass, "sparkBnk5000_23", "I");
        if (sparkBnkField) {
            env->SetIntField(holder_obj, sparkBnkField, sparkBnk5000_23_val);
        }
        
        jfieldID resultField = env->GetFieldID(holderClass, "result", "I");
        if (resultField) {
            env->SetIntField(holder_obj, resultField, result_val);
        }

        LOGD("⚡ 8");

        // В блоке обработки patternVectArray (⚡ 8):
        if (patternVect_data) {
            int pattern_len = 45; // Фиксированная длина patternVect
            jfieldID patternVectField = env->GetFieldID(holderClass, "patternVectArray", "[B");
            if (patternVectField) {
                jbyteArray pattern_jarray = env->NewByteArray(pattern_len);
                if (pattern_jarray) {
                    env->SetByteArrayRegion(pattern_jarray, 0, pattern_len, reinterpret_cast<jbyte*>(patternVect_data));
                    env->SetObjectField(holder_obj, patternVectField, pattern_jarray);
                    free(patternVect_data);
                }
            }
        }

        LOGD("⚡ 9");

        // В блоке обработки waveAtomVectArray (⚡ 9):
        if (waveAtomVect_data) {
            int wave_len = 15; // Фиксированная длина waveAtomVect
            jfieldID waveAtomVectField = env->GetFieldID(holderClass, "waveAtomVectArray", "[B");
            if (waveAtomVectField) {
                jbyteArray wave_jarray = env->NewByteArray(wave_len);
                if (wave_jarray) {
                    env->SetByteArrayRegion(wave_jarray, 0, wave_len, reinterpret_cast<jbyte*>(waveAtomVect_data));
                    env->SetObjectField(holder_obj, waveAtomVectField, wave_jarray);
                    free(waveAtomVect_data);
                }
            }
        }

        LOGD("⚡ 10");
    }

    cleanup:
    // 7. Освобождение ресурсов JNI
    env->ReleaseByteArrayElements(bufferTop_, bufferTop_ptr, JNI_ABORT);
    env->ReleaseByteArrayElements(bufferBot_, bufferBot_ptr, JNI_ABORT);
    env->ReleaseStringUTFChars(bnkType_, bnkType_cstr);
    env->ReleaseStringUTFChars(path_, path_cstr);

    LOGD("⚡ 11");
}

extern "C" JNIEXPORT jbyteArray JNICALL
Java_ru_cbr_banknotesrf_LibHolder_loadBytesFromFile(JNIEnv* env, jobject thiz, jstring filePathStr) {

    // Преобразование jstring в C-строку
    const char *filePath = env->GetStringUTFChars(filePathStr, JNI_FALSE);
    if (filePath == nullptr) {
        return nullptr; // Ошибка при получении строки
    }

    FILE *file = fopen(filePath, "rb");

    // Освобождаем строку сразу после использования
    env->ReleaseStringUTFChars(filePathStr, filePath);

    if (!file) {
        return nullptr;
    }

    fseek(file, 0, SEEK_END);
    long fileSize = ftell(file);
    fseek(file, 0, SEEK_SET);

    if (fileSize <= 0) {
        fclose(file);
        return nullptr;
    }

    // Выделяем буфер
    jbyteArray result = env->NewByteArray(fileSize);
    if (result == nullptr) {
        fclose(file);
        return nullptr;
    }

    // Читаем данные
    jbyte* buffer = (jbyte*)malloc(fileSize);
    if (!buffer) {
        fclose(file);
        env->DeleteLocalRef(result);
        return nullptr;
    }

    size_t readCount = fread(buffer, 1, fileSize, file);
    fclose(file);

    if (readCount != fileSize) {
        free(buffer);
        env->DeleteLocalRef(result);
        return nullptr;
    }

    // Копируем данные из C буфера в JNI jbyteArray
    env->SetByteArrayRegion(result, 0, fileSize, buffer);
    free(buffer);

    return result;
}
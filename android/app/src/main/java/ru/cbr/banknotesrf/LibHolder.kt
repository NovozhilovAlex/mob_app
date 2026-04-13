package ru.cbr.banknotesrf

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.util.Log
import android.util.Base64
import com.facebook.react.module.annotations.ReactModule
import com.mrousavy.camera.frameprocessors.Frame
import java.nio.ByteBuffer

@ReactModule(name = LibHolder.NAME)
class LibHolder(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "SignCheckCpp"

        //fun getPathFromHolder(holder: LibHolder): String = holder.getFilesDirPath()
        

    }

    init {
        PathProvider.initialize(reactContext)
        try {
            System.loadLibrary("SignCheckCpp")
            System.loadLibrary("SignCheckCpp_jni")
            Log.d("LibHolder", "Libraries loaded")
        } catch (e: UnsatisfiedLinkError) {
            Log.e("LibHolder", "Load failed", e)
        }
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun initLibAR(promise: Promise) {
        try {
            initLibArNative()
            promise.resolve(1)
        } catch (t: Throwable) {
            promise.reject("E_LIBAR_INIT", t.message, t)
        }
    }

    @ReactMethod
    fun setPersistentDataPath(pathJs: String, promise: Promise) {
        try {
            val path = PathProvider.getFilesDirPath()
            setPersistentDataPathNative(path)
            promise.resolve(1)
        } catch (t: Throwable) {
            promise.reject("E_SET_PATH", t.message, t)
        }
    }

    @ReactMethod
    fun addTargetFromPath(imagePath: String, promise: Promise) {
        try {
            val byteArray = loadBytesFromFile(imagePath)
            if (byteArray != null) {
                addTargetNative(byteArray, byteArray.size)
                promise.resolve(true)
        } else {
            promise.reject("E_FILE_READ", "Cannot read file")
        }
        } catch (t: Throwable) {
            promise.reject("E_ADD_TARGET", t.message, t)
        }
    }

    @ReactMethod
    fun initNetRectDataMatrixFromPath(path: String, promise: Promise) {
        try {
            val byteArray = loadBytesFromFile(path)
        
            if (byteArray == null) {
                promise.reject("E_FILE_READ", "Failed to read file at path: $path")
                return
            }
        
            val length = byteArray.size

            // Вызываем нативный метод напрямую
            initNetRectDataMatrixNative(byteArray, length)
            promise.resolve(true)
        
        } catch (t: Throwable) {
            promise.reject("E_INIT_RECT_DATA_MATRIX", t.message ?: "Unknown error", t)
        }
    }

    @ReactMethod
    fun initNetClassifyDataMatrixFromPath(path: String, promise: Promise) {
        try {
            val byteArray = loadBytesFromFile(path)
        
            if (byteArray == null) {
                promise.reject("E_FILE_READ", "Failed to read file at path: $path")
                return
            }
        
            val length = byteArray.size

            // Вызываем нативный метод напрямую
            initNetClassifyDataMatrixNative(byteArray, length)
            promise.resolve(true)
        
        } catch (t: Throwable) {
            promise.reject("E_INIT_CLASSIFY_DATA_MATRIX", t.message ?: "Unknown error", t)
        }
    }

    @ReactMethod
    fun initSpark5k23FromPath(path: String, promise: Promise) {
        try {
            val byteArray = loadBytesFromFile(path)
        
            if (byteArray == null) {
                promise.reject("E_FILE_READ", "Failed to read file at path: $path")
                return
            }
        
            val length = byteArray.size

            // Вызываем нативный метод напрямую
            initSpark5k23Native(byteArray, length)
            promise.resolve(true)
        
        } catch (t: Throwable) {
            promise.reject("E_INIT_RECT_DATA_MATRIX", t.message ?: "Unknown error", t)
        }
    }
	
    @ReactMethod
    fun signCheckFromPaths(photo1Path: String, photo1Width: Int, photo1Height: Int, photo1Channels: Int, photo1IsRotated: Boolean,
        photo2Path: String, photo2Width: Int, photo2Height: Int, photo2Channels: Int, photo2IsRotated: Boolean, bnkType: String, pixelFormat: Int, pathJs: String,
        promise: Promise) {
        try {
            val holder = SignCheckHolder()
            val path = PathProvider.getFilesDirPath()
            if (bnkType != "Front5000_2023") {
                val photo1ByteArray = loadBytesFromFile(photo1Path)
                val photo2ByteArray = loadBytesFromFile(photo2Path)
                if (photo1ByteArray != null && photo2ByteArray != null) {
                    checkSignNative(
                        photo1ByteArray, photo1Width, photo1Height, photo1Channels,
                        photo2ByteArray, photo2Width, photo2Height, photo2Channels,
                        bnkType, photo1IsRotated, pixelFormat, path,
                        photo1ByteArray.size, photo2ByteArray.size, photo2IsRotated, holder
                    )
                } else {
                    promise.reject("E_FILE_READ", "Cannot read files")
                }
            } else {
                val photo1ByteArray = loadBytesFromFile(photo1Path)
                if (photo1ByteArray != null) {
                    checkSignNative(
                        photo1ByteArray, photo1Width, photo1Height, photo1Channels,
                        ByteArray(1), 0, 0, 0,
                        bnkType, photo1IsRotated, pixelFormat, path,
                        photo1ByteArray.size, 0, false, holder
                    )
                } else {
                    promise.reject("E_FILE_READ", "Cannot read files")
                }
            }

            promise.resolve(holder.result)
        
        } catch (t: Throwable) {
            promise.reject("E_SIGN_CHECK", t.message, t)
        }
    }

    class SignCheckHolder {
        var bwcoef: Float = 0f
        var microelsCount: Int = 0
        var sparkVal1: Float = 0f
        var sparkVal2: Float = 0f
        var sparkBnk5000_23: Int = -1
        var result: Int = -2
        var patternVectArray: ByteArray? = null
        var waveAtomVectArray: ByteArray? = null
    }


    private external fun initLibArNative()
    private external fun setPersistentDataPathNative(path: String)
    private external fun addTargetNative(buffer: ByteArray, length: Int)
    private external fun initNetRectDataMatrixNative(buffer: ByteArray, length: Int)
    private external fun initNetClassifyDataMatrixNative(buffer: ByteArray, length: Int)
    private external fun initSpark5k23Native(buffer: ByteArray, length: Int)
    private external fun checkSignNative(
    bufferTop: ByteArray, widthTop: Int, heightTop: Int, channelsTop: Int,
    bufferBot: ByteArray, widthBot: Int, heightBot: Int, channelsBot: Int,
    bnkType: String, isRotatedTop: Boolean, pixelFormat: Int, path: String,
    bufferSizeTop: Int, bufferSizeBot: Int, isRotatedBot: Boolean,
    holder: SignCheckHolder)
	
    private external fun loadBytesFromFile(filePath: String): ByteArray?
}

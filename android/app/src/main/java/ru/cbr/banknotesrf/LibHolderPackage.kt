package ru.cbr.banknotesrf

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

class LibHolderPackage : ReactPackage {
    init {
        // Регистрация плагина для VisionCamera
        FrameProcessorPluginRegistry.addFrameProcessorPlugin("getRectDataMatrix") { proxy, options ->
            LibHolderPlugin(proxy, options)
        }
    }

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(LibHolder(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}

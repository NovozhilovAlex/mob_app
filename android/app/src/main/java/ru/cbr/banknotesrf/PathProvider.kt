package ru.cbr.banknotesrf

import com.facebook.react.bridge.*

object PathProvider {
    lateinit var appContext: ReactApplicationContext

    fun initialize(context: ReactApplicationContext) {
        appContext = context
    }

    fun getFilesDirPath(): String = appContext.filesDir.absolutePath
}

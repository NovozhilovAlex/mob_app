package ru.cbr.banknotesrf

import com.facebook.react.bridge.*
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import java.nio.ByteBuffer
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext

class LibHolderPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?) : FrameProcessorPlugin() {

    override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
        try {
            val isRotated = arguments?.get("isRotated") as? Boolean ?: false
            val pixelFormat = (arguments?.get("pixelFormat") as? Double)?.toInt() ?: 2
            //val path = arguments?.get("path") as? String ?: ""
            val path = PathProvider.getFilesDirPath()

            val image = frame.image
            val width = image.width
            val height = image.height
            val channels = 3

            val nv21Bytes = createNV21FromFrame(frame)
            val nv21Size = nv21Bytes.size

            val holder = RectDataHolder()

            getRectDataMatrixAndPointsClassesScoresNative(
                nv21Bytes, width, height, channels, isRotated, pixelFormat, path, nv21Size, holder
            )

            val result = HashMap<String, Any>()
            result["targetId"] = holder.targetId
            result["result"] = holder.result

            holder.pointsArray?.let { bytes ->
                result["pointsArray"] = bytes.map { it.toInt() }
            }
            holder.classesArray?.let { bytes ->
                result["classesArray"] = bytes.map { it.toInt() }
            }
            holder.scoresArray?.let { bytes ->
                result["scoresArray"] = bytes.map { it.toDouble() }
            }

            return result

        } catch (e: Exception) {
            return mapOf("error" to (e.message ?: "Unknown error"))
        }
    }

    class RectDataHolder {
        var targetId: Int = -1
        var result: Int = -1
        var pointsArray: ByteArray? = null 
        var classesArray: ByteArray? = null 
        var scoresArray: ByteArray? = null 
    }

    private external fun getRectDataMatrixAndPointsClassesScoresNative(
        buffer: ByteArray, width: Int, height: Int, channels: Int, 
        isRotated: Boolean, pixelFormat: Int, path: String, 
        bufferSize: Int, holder: RectDataHolder
    )

    private fun createNV21FromFrame(frame: Frame): ByteArray {
        val image = frame.image
        val planes = image.planes
        val width = image.width
        val height = image.height

        val yPlane = planes[0]
        val uPlane = planes[1]
        val vPlane = planes[2]

        val yBuffer = yPlane.buffer
        val uBuffer = uPlane.buffer
        val vBuffer = vPlane.buffer

        val ySize = yBuffer.remaining()
        val uvSize = (width * height) / 2
        val nv21Size = ySize + uvSize

        val nv21Bytes = ByteArray(nv21Size)

        yBuffer.get(nv21Bytes, 0, ySize)

        var offset = ySize
        val uvPixelStride = vPlane.pixelStride
        val uvRowStride = vPlane.rowStride

        val halfHeight = height / 2
        for (row in 0 until halfHeight) {
            val uvRowOffset = row * uvRowStride
            var col = 0
            while (col < width) {
                if (offset >= nv21Size) break

                vBuffer.position(uvRowOffset + col)
                nv21Bytes[offset++] = vBuffer.get()

                uBuffer.position(uvRowOffset + col)
                nv21Bytes[offset++] = uBuffer.get()

                col += uvPixelStride
            }
        }

        return nv21Bytes
    }
}

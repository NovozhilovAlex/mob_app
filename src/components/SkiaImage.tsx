import React from "react";
import {Image, useImage} from "@shopify/react-native-skia";
import {findImageInMap} from "@/src/utils/imageMap";
import {SkEnum} from "@shopify/react-native-skia/lib/typescript/src/dom/types/Common";
import {BlendMode} from "@shopify/react-native-skia/src/skia/types/Paint/BlendMode";

export function SkiaImage(props: {
  width: number,
  height: number,
  resPath: string,
  blendMode?: SkEnum<typeof BlendMode> }) {
  return <Image
    width={props.width}
    height={props.height}
    image={useImage(findImageInMap(props.resPath))}
    fit="fill"
    x={0}
    y={0}
    blendMode={props.blendMode}
  />;
}
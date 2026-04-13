import React, {useEffect, useRef, useState} from 'react';
import {LayoutChangeEvent, View} from 'react-native';
import {Image, Canvas, Mask, useImage, Group} from "@shopify/react-native-skia";
import {
  SharedValue,
  useDerivedValue
} from "react-native-reanimated";
import {Sign, SignRes} from "@/src";
import {findImageInMap} from "@/src/utils/imageMap";
import {SignImageOnBanknote} from "@/src/components/SignImageOnBanknote";
import {SignPartComponent} from "@/src/components/SignPartComponent";
import {SkiaImage} from "@/src/components/SkiaImage";



export default function OVMISign(props: {
  sign: Sign,
  normRotationX: SharedValue<number>,
  normRotationY: SharedValue<number>,
  banknoteWidth: number,
  banknoteHeight: number
}) {
  const maxAngleX = 30;
  const maxAngleY = 30;

  const signRef = useRef<Sign>(props.sign);
  useEffect(() => {
    signRef.current = props.sign;
  }, [props.sign]);


  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };


  function getAnimatedTransform(width: number, height: number,
                                angleX:number, angleY:number,
                                signData?: SignRes) {
    'worklet';
    if (!signData)
      return [
        {translateX: 0},
        {translateY: 0}
      ];

    let valueX = angleX / maxAngleX;

    const minYValue = signData.move_min_y! - (signData.pos_y ?? 0)
    const maxYValue = signData.move_max_y! + (signData.pos_y ?? 0);

    let translateYPercent = 0;
    if (valueX < 0)
      translateYPercent = (signData.height! / props.banknoteHeight) * (valueX) * minYValue;
    else
      translateYPercent = (signData.height! / props.banknoteHeight) * (valueX) * maxYValue;



    let valueY = angleY / maxAngleY;

    const minXValue = signData.move_min_x! - (signData.pos_x ?? 0)
    const maxXValue = signData.move_max_x! + (signData.pos_x ?? 0);

    let translateXPercent = 0;
    if (valueY < 0)
      translateXPercent = (signData.width! / props.banknoteWidth) * (valueY) * minXValue;
    else
      translateXPercent = (signData.width! / props.banknoteWidth) * (valueY) * maxXValue;

    return [
      {translateX: translateXPercent * width},
      {translateY: translateYPercent * height}
    ];
  }

  const animatedTransformForLayer1 = useDerivedValue(() => {
    return getAnimatedTransform(size.width, size.height,
      props.normRotationX.value, props.normRotationY.value,
      signRef.current.sign_res5_data);
  },[size.width, size.height]);

  const animatedTransformForLayer2 = useDerivedValue(() => {
    return getAnimatedTransform(size.width, size.height,
      props.normRotationX.value, props.normRotationY.value,
      signRef.current.sign_res7_data);
  },[size.width, size.height]);


  if (!signRef.current) {
    return null;
  }

  console.log("OVMISign Init:", signRef.current);

  return (
    <View
      onLayout={onLayout}
      style={{position:'absolute',
        width: '100%',
        height: '100%'}}>

      {/*BG*/}
      {signRef.current.sign_res1_data &&
        (
          <SignImageOnBanknote signRes={signRef.current.sign_res1_data!}
                               banknoteWidth={props.banknoteWidth}
                               banknoteHeight={props.banknoteHeight}/>
        )}


      {/*Full colored sign*/}
      {signRef.current.sign_res4_data && signRef.current.sign_res2_data && (
        <SignPartComponent signRes={signRef.current.sign_res2_data!}
                         banknoteWidth={props.banknoteWidth}
                         banknoteHeight={props.banknoteHeight}
                         insideView={({ width, height }) => (
                           <Canvas style={{width: width, height: height}}>
                             <Mask
                               mode="alpha"
                               mask={
                                 <SkiaImage width={width} height={height} resPath={signRef.current.sign_res4_data?.res_path!}/>
                               }>
                               <SkiaImage width={width} height={height} resPath={signRef.current.sign_res2_data?.res_path!}/>
                             </Mask>
                           </Canvas>
                         )}
        />
      )}

      {/*Line layer 2*/}
      {signRef.current.sign_res4_data && signRef.current.sign_res6_data && signRef.current.sign_res7_data && (
          <SignPartComponent signRes={signRef.current.sign_res6_data!}
                             banknoteWidth={props.banknoteWidth}
                             banknoteHeight={props.banknoteHeight}
                             insideView={({ width, height }) => (
                               <Canvas style={{width: width, height: height}}>
                                 <Group>
                                   <Mask
                                     mode="alpha"
                                     mask={
                                       <Group>
                                         <Group transform={animatedTransformForLayer2}>
                                           <SkiaImage width={width} height={height} resPath={signRef.current.sign_res7_data?.res_path!}/>
                                         </Group>

                                         <SkiaImage width={width} height={height} resPath={signRef.current.sign_res4_data?.res_path!}
                                                    blendMode={"srcIn"}/>
                                       </Group>
                                     }>
                                     <SkiaImage width={width} height={height} resPath={signRef.current.sign_res6_data?.res_path!}/>
                                   </Mask>
                                 </Group>
                               </Canvas>
                             )}
          />
        )}


      {/*Line layer 1*/}
      {signRef.current.sign_res4_data && signRef.current.sign_res3_data && signRef.current.sign_res5_data && (
        <SignPartComponent signRes={signRef.current.sign_res3_data!}
                           banknoteWidth={props.banknoteWidth}
                           banknoteHeight={props.banknoteHeight}
                           insideView={({ width, height }) => (
                             <Canvas style={{width: width, height: height}}>
                               <Group>
                                 <Mask
                                   mode="alpha"
                                   mask={
                                     <Group>
                                       <Group transform={animatedTransformForLayer1}>
                                         <SkiaImage width={width} height={height} resPath={signRef.current.sign_res5_data?.res_path!}/>
                                       </Group>

                                       <SkiaImage width={width} height={height} resPath={signRef.current.sign_res4_data?.res_path!}
                                                  blendMode={"srcIn"}/>
                                     </Group>
                                   }>
                                   <SkiaImage width={width} height={height} resPath={signRef.current.sign_res3_data?.res_path!}/>
                                 </Mask>
                               </Group>
                             </Canvas>
                           )}
        />
      )}

    </View>

  );
}
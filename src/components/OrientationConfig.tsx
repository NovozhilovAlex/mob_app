import {View} from "react-native";
import React, {useCallback} from "react";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {useFocusEffect} from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import {OrientationLock} from "expo-screen-orientation";

export default function OrientationConfig(props: {
  orientationForLock?: OrientationLock,
  isLockCurrentOrientation?: boolean
}) {

  const {orientation} = useAppSettingsStore();

  const lockMap: Record<ScreenOrientation.Orientation, OrientationLock> = {
    [ScreenOrientation.Orientation.PORTRAIT_UP]: OrientationLock.PORTRAIT_UP,
    [ScreenOrientation.Orientation.PORTRAIT_DOWN]: OrientationLock.PORTRAIT_DOWN,
    [ScreenOrientation.Orientation.LANDSCAPE_LEFT]: OrientationLock.LANDSCAPE_LEFT,
    [ScreenOrientation.Orientation.LANDSCAPE_RIGHT]: OrientationLock.LANDSCAPE_RIGHT,
    [ScreenOrientation.Orientation.UNKNOWN]: OrientationLock.DEFAULT,
  };

  const lockOrientation = async (orientationLock: OrientationLock) => {
    await ScreenOrientation.lockAsync(orientationLock);
  };

  const lockCurrentOrientation = async () => {
    const current = await ScreenOrientation.getOrientationAsync();
    const lockType = lockMap[current] || OrientationLock.DEFAULT;
    await ScreenOrientation.lockAsync(lockType);
  };

  const unlockOrientation = async () => {
    await ScreenOrientation.unlockAsync();
  };

  useFocusEffect(
    useCallback(() => {
      if (props.orientationForLock){
        lockOrientation(props.orientationForLock).then();
        return;
      }

      if (props.isLockCurrentOrientation === true) {
        lockCurrentOrientation().then()
        return;
      }

      if (orientation === 'portrait'){
        lockOrientation(OrientationLock.PORTRAIT_UP).then();
        return;
      }

      if (orientation === 'landscape'){
        lockOrientation(OrientationLock.LANDSCAPE_RIGHT).then();
        return;
      }

      unlockOrientation().then();
    }, [props.orientationForLock, props.isLockCurrentOrientation, orientation])
  );

  return <View style={{
    position: 'absolute'
  }}/>;
}

import {Image, StatusBar, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View} from "react-native";
import React, {ReactElement} from "react";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {useNavigation, useRouter} from "expo-router";
import {AppColors} from "@/src/constants/appColors";
import {DrawerActions} from "@react-navigation/native";
import {useCustomOrientation} from "@/src/hooks/useCustomOrientation";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import StatusBarConfig from "@/src/components/StatusBarConfig";

export default function PageWithTitle(props: {
  title?: ReactElement;
  background?: ReactElement;
  ignoreSafeAreaForContent?: boolean;
  statusBarStyle?: 'dark-text' | 'light-text';
  content?: ReactElement;
}) {
  const insets = useSafeAreaInsets();

  return <View style={{
  }}>
    {props.statusBarStyle
    ? (
        <StatusBarConfig style={props.statusBarStyle}/>
      )
    : (
        <StatusBarConfig/>
      )
    }

    <View style={{position:'absolute', width: '100%', height: '100%'}}>
      {props.background && (props.background)}
    </View>
    <View style={{width: '100%', height: '100%'}}>
      {props.title && (props.title)}
      <View style={{flex:1}}>
        {props.content && !props.ignoreSafeAreaForContent && (
          <View style={{
            width: '100%', height: '100%',
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingBottom: insets.bottom
          }}>
            <View style={{width: '100%', height: '100%'}}>
              {props.content}
            </View>
          </View>
        )}

        {props.content && props.ignoreSafeAreaForContent && (
          <View style={{width: '100%', height: '100%'}}>
            {props.content}
          </View>
        )}
      </View>
    </View>
  </View>
}

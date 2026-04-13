import {Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View} from "react-native";
import React, {ReactElement} from "react";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {useNavigation, useRouter} from "expo-router";
import {AppColors} from "@/src/constants/appColors";
import {DrawerActions} from "@react-navigation/native";
import {useCustomOrientation} from "@/src/hooks/useCustomOrientation";
import {useSafeAreaInsets} from "react-native-safe-area-context";

export default function PageTitle(props: {
  title: string,
  isMenuEnable?: boolean,
  isCloseDisable?: boolean,
  isTransparent?: boolean,
  isAlwaysNightMode?: boolean,
  rightElement?: ReactElement;
}) {

  const {nightMode} = useAppSettingsStore();
  const router = useRouter();
  const navigation = useNavigation();
  const orientation = useCustomOrientation();
  const insets = useSafeAreaInsets();

  return <View style={[
    {
      backgroundColor: props.isTransparent
        ? 'transparent'
        : nightMode ? AppColors.dark.bgColor : AppColors.light.bgColor,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      zIndex: 1000
    }
  ]}>
    <View style={{
      width: '100%',
      height: '100%'
    }}>
      <View style={[styles.titleContainer, {
        minHeight: orientation === 'PORTRAIT' ? 70 : 40
      }]}>
        <Text style={[styles.headerTitle, {
          color: (nightMode || props.isAlwaysNightMode) ? "#FFFFFF" : "#000000",
        }]}>
          {props.title}
        </Text>
      </View>

      {!props.isCloseDisable && (
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.rightButton, {
            justifyContent: 'center',
            alignItems: 'center'
          }]}>
          <Image
            source={require("@/assets/Image/Resources/Icons/WhiteCancelIcon.png")}
            style={{
              width: 24,
              height: 24,
              tintColor: (nightMode || props.isAlwaysNightMode) ? "#FFFFFF" : "#000000",
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}

      {props.rightElement && (
        <View style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          justifyContent: 'center',
          alignItems: 'flex-end'
        }}>
          {props.rightElement}
        </View>
      )}


      {props.isMenuEnable && (
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={[styles.leftButton, {
            justifyContent: 'center',
            alignItems: 'center'
          }]}>
          <Image
            source={require("@/assets/Image/Resources/Icons/MenuIcon.png")}
            style={{
              width: 30,
              height: 30,
              tintColor: (nightMode || props.isAlwaysNightMode) ? "#FFFFFF" : "#000000",
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    width: "100%",
    paddingHorizontal:60,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rightButton:{
    position: 'absolute',
    top: 0,
    width: 70,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  leftButton:{
    position: 'absolute',
    top: 0,
    width: 70,
    left: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
});

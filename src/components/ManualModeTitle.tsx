import {Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View} from "react-native";
import React, {ReactElement} from "react";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {useNavigation, useRouter} from "expo-router";
import {AppColors} from "@/src/constants/appColors";
import {DrawerActions} from "@react-navigation/native";
import {useCustomOrientation} from "@/src/hooks/useCustomOrientation";
import {useSafeAreaInsets} from "react-native-safe-area-context";

export default function ManualModeTitle(props: {
  title: string,
  icon: any,
  onClosePress?: () => void;
}) {

  const router = useRouter();
  const orientation = useCustomOrientation();
  const insets = useSafeAreaInsets();

  return <View style={[
    {
      backgroundColor: 'rgba(0,0,0,0.75)',
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
          color: "#FFFFFF",
        }]}>
          {props.title}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => {
          if (props.onClosePress)
            props.onClosePress()
        }}
        style={[styles.leftButton, {
          justifyContent: 'center',
          alignItems: 'center'
        }]}>
        <Image
          source={require("@/assets/Image/Resources/Icons/WhiteCancelIcon.png")}
          style={{
            width: 24,
            height: 24,
            tintColor: "#FFFFFF",
          }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View style={styles.rightButton}>
        {props.icon && (
          <Image
            source={props.icon}
            style={{ width: 54, height: 54, tintColor: '#FFFFFF' }}
            resizeMode="contain"
          />
        )}
      </View>
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

import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {accessibilityStrings} from "@/src/locales/accesibilityStrings";
import AccessibilityButtonWithMargin from "@/src/components/AccessibilityButtonWithMargin";
import {useRouter} from "expo-router";
import {OrientationLock} from "expo-screen-orientation";
import OrientationConfig from "@/src/components/OrientationConfig";
import StatusBarConfig from "@/src/components/StatusBarConfig";

export default function Nominals() {
  const router = useRouter();
  const {nightMode} = useAppSettingsStore();
  const backgroundColor = nightMode ? '#1C1C1E' : '#FFFFFF';
  const insets = useSafeAreaInsets();


  function openBnkInfo(description: string) {
    router.push({
      pathname: "/(accessibility)/banknote-info",
      params: {
        description: description
      }
    });
  }

  const openModificationPage5000 = async () => {
    router.push({
      pathname: "/(accessibility)/modifications",
      params: {
        title: accessibilityStrings.res.bnk_5000,
        items: JSON.stringify([
          {
            name: accessibilityStrings.res.bnk_5000_1997,
            description: accessibilityStrings.banknote_descriptions.bnk_5000_1997_description
          },
          {
            name: accessibilityStrings.res.bnk_5000_2023,
            description: accessibilityStrings.banknote_descriptions.bnk_5000_2023_description
          }])
      }
    });
  };

  const openModificationPage1000 = async () => {
    router.push({
      pathname: "/(accessibility)/modifications",
      params: {
        title: accessibilityStrings.res.bnk_1000,
        items: JSON.stringify([
          {
            name: accessibilityStrings.res.bnk_1000_1997,
            description: accessibilityStrings.banknote_descriptions.bnk_1000_1997_description
          },
          {
            name: accessibilityStrings.res.bnk_1000_2023,
            description: accessibilityStrings.banknote_descriptions.bnk_1000_2023_description
          }])
      }
    });
  }

  const openModificationPage100 = async () => {
    router.push({
      pathname: "/(accessibility)/modifications",
      params: {
        title: accessibilityStrings.res.bnk_100,
        items: JSON.stringify([
          {
            name: accessibilityStrings.res.bnk_100_1997,
            description: accessibilityStrings.banknote_descriptions.bnk_100_1997_description
          },
          {
            name: accessibilityStrings.res.bnk_100_2022,
            description: accessibilityStrings.banknote_descriptions.bnk_100_2022_description
          }])
      }
    });
  }

  const openBnkCommemorative = async () => {
    router.push({
      pathname: "/(accessibility)/modifications",
      params: {
        title: accessibilityStrings.res.bnk_commemorative,
        items: JSON.stringify([
          {
            name: accessibilityStrings.res.bnk_100_2014,
            description: accessibilityStrings.banknote_descriptions.bnk_100_2014_description
          },
          {
            name: accessibilityStrings.res.bnk_100_2015,
            description: accessibilityStrings.banknote_descriptions.bnk_100_2015_description
          },
          {
            name: accessibilityStrings.res.bnk_100_2018,
            description: accessibilityStrings.banknote_descriptions.bnk_100_2018_description
          }])
      }
    });
  }


  return (
    <View style={[
      styles.container,
      {
        backgroundColor: backgroundColor,
        paddingBottom: insets.bottom
      }
    ]}>
      <OrientationConfig orientationForLock={OrientationLock.PORTRAIT_UP}/>
      <StatusBarConfig/>

      <ScrollView
        style={[styles.container]}>
        <AccessibilityButtonWithMargin text={accessibilityStrings.res.bnk_5000}
                                       onPress={openModificationPage5000}/>
        <AccessibilityButtonWithMargin text={accessibilityStrings.res.bnk_2000}
                                       onPress={()=>{openBnkInfo(accessibilityStrings.banknote_descriptions.bnk_2000_description)}}/>
        <AccessibilityButtonWithMargin text={accessibilityStrings.res.bnk_1000}
                                       onPress={openModificationPage1000}/>
        <AccessibilityButtonWithMargin text={accessibilityStrings.res.bnk_500}
                                       onPress={()=>{openBnkInfo(accessibilityStrings.banknote_descriptions.bnk_500_description)}}/>
        <AccessibilityButtonWithMargin text={accessibilityStrings.res.bnk_200}
                                       onPress={()=>{openBnkInfo(accessibilityStrings.banknote_descriptions.bnk_200_description)}}/>
        <AccessibilityButtonWithMargin text={accessibilityStrings.res.bnk_100}
                                       onPress={openModificationPage100}/>
        <AccessibilityButtonWithMargin text={accessibilityStrings.res.bnk_50}
                                       onPress={()=>{openBnkInfo(accessibilityStrings.banknote_descriptions.bnk_50_description)}}/>
        <AccessibilityButtonWithMargin text={accessibilityStrings.res.bnk_10}
                                       onPress={()=>{openBnkInfo(accessibilityStrings.banknote_descriptions.bnk_10_description)}}/>
        <AccessibilityButtonWithMargin text={accessibilityStrings.res.bnk_5}
                                       onPress={()=>{openBnkInfo(accessibilityStrings.banknote_descriptions.bnk_5_description)}}/>
        <AccessibilityButtonWithMargin text={accessibilityStrings.res.bnk_commemorative}
                                       numberOfLines={2}
                                       onPress={openBnkCommemorative}/>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textContainer: {
    padding: 20
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    fontSize: 50
  },
});
import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {useLocalSearchParams, useNavigation, useRouter} from "expo-router";
import AccessibilityButtonWithMargin from "@/src/components/AccessibilityButtonWithMargin";
import {OrientationLock} from "expo-screen-orientation";
import OrientationConfig from "@/src/components/OrientationConfig";
import StatusBarConfig from "@/src/components/StatusBarConfig";

export default function Modifications() {
  const router = useRouter();
  const navigation = useNavigation();
  const {nightMode} = useAppSettingsStore();
  const backgroundColor = nightMode ? '#1C1C1E' : '#FFFFFF';
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams();
  const title = String(params.title);
  const items = JSON.parse(params.items as string);
  const itemsArr = items as any[];

  if (title)
  {
    navigation.setOptions({
      title: title, // Обновит текст в шапке
    });
  }


  function openBnkInfo(description: string) {
    router.push({
      pathname: "/(accessibility)/banknote-info",
      params: {
        description: description
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
        {itemsArr.map((item, index) => (
          <AccessibilityButtonWithMargin key={index}
                                         text={item.name}
                                         numberOfLines={2}
                                         onPress={()=>openBnkInfo(item.description)}/>
        ))}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
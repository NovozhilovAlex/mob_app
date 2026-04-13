import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {useTranslation} from "react-i18next";
import PageTitle from "@/src/components/PageTitle";
import {AppColors} from "@/src/constants/appColors";
import PageWithTitle from "@/src/components/PageWithTitle";
import {DefaultBackground} from "@/src/components/DefaultBackground";
import OrientationConfig from "@/src/components/OrientationConfig";

export default function InfoScreen() {
  const router = useRouter();
  const {t} = useTranslation();

  const {nightMode} = useAppSettingsStore();

  const menuItems = [
    {
      id: 1,
      title: t('info.instruction'),
      icon: 'book-outline' as const,
      //onPress: () => router.push('/instruction2'),
    },
    {
      id: 2,
      title: t('info.howCheckAuthenticity.title'),
      icon: 'shield-checkmark-outline' as const,
      onPress: () => router.push('/authenticity'),
    },
    {
      id: 3,
      title: t('info.news'),
      icon: 'newspaper-outline' as const,
      //onPress: () => router.push('/testPage'),
    },
    {
      id: 4,
      title: t('info.licenseAgreement.title'),
      icon: 'document-text-outline' as const,
      onPress: () => {
        router.push('/license');
      },
    },
    {
      id: 5,
      title: t('info.aboutApp.title'),
      icon: 'information-circle-outline' as const,
      onPress: () => router.push('/about-app'),
    },
  ];

  return (
    <View style={{flex: 1}}>
      <OrientationConfig/>
      <PageWithTitle
        title={<PageTitle title={t('info.title')}/>}
        background={<DefaultBackground/>}
        content={
          <ScrollView
            style={styles.content}>
            <View style={[
              styles.menuList,
              {
                borderTopColor: nightMode ? AppColors.dark.borderColor : AppColors.light.borderColor
              }
            ]}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, {
                    borderBottomColor: nightMode ? AppColors.dark.borderColor : AppColors.light.borderColor
                  }]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <Text style={[
                      styles.menuItemText,
                      {color: nightMode ? '#fff' : '#000'}
                    ]}>
                      {item.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 70,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  menuList: {
    marginHorizontal: 15,
    borderTopWidth: 0.5
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 20,
    marginLeft: 0,
    fontWeight: 'bold',
    flex: 1,
  }
});
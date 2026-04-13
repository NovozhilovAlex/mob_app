import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppSettingsStore, Orientation } from "@/src/services/AppSettingsService";
import { useTranslation } from 'react-i18next';
import {AppColors} from "@/src/constants/appColors";
import PageTitle from "@/src/components/PageTitle";
import {DefaultBackground} from "@/src/components/DefaultBackground";
import PageWithTitle from "@/src/components/PageWithTitle";
import OrientationConfig from "@/src/components/OrientationConfig";

export default function OrientationModal() {
  const router = useRouter();
  const {nightMode, orientation: currentOrientation, setOrientation} = useAppSettingsStore();
  const {t} = useTranslation();

  const [selectedOrientation, setSelectedOrientation] = useState<Orientation>(currentOrientation);

  const orientations = [
    {id: 'auto', label: t('settings.orientation.auto'), value: 'auto' as const},
    {id: 'portrait', label: t('settings.orientation.portrait'), value: 'portrait' as const},
    {id: 'landscape', label: t('settings.orientation.landscape'), value: 'landscape' as const},
  ];

  const handleSelectOrientation = (orientation: typeof orientations[0]) => {
    setSelectedOrientation(orientation.value);
    setOrientation(orientation.value);
    setTimeout(() => router.back(), 300);
  };

  return (
    <View style={{flex: 1}}>
      <OrientationConfig/>
      <PageWithTitle
        title={<PageTitle title={t('settings.language')}/>}
        background={<DefaultBackground/>}
        content={
          <ScrollView
            style={styles.content}
          >
            <View style={[
              styles.orientationList,
              {
                borderTopColor: nightMode ? '#ffffff50' : '#00000050',
              }
            ]}>
              {orientations.map((orientation) => (
                <TouchableOpacity
                  key={orientation.id}
                  style={[
                    styles.orientationItem,
                    {
                      borderBottomColor: nightMode ? '#ffffff50' : '#00000050'
                    }
                  ]}
                  onPress={() => handleSelectOrientation(orientation)}
                >
                  <View style={styles.orientationLeft}>
                    <View style={[
                      styles.radioButton,
                      {
                        borderColor: nightMode ? '#ffffff' : '#000000',
                      }
                    ]}>
                      {selectedOrientation === orientation.value && (
                        <View
                          style={[
                            styles.radioButtonSelected,
                            {backgroundColor: nightMode ? '#ffffff' : '#000000'}
                          ]}/>
                      )}
                    </View>
                    <View style={styles.orientationTextContainer}>
                      <Text style={[
                        styles.orientationText,
                        {color: nightMode ? '#ffffff' : '#000000'}
                      ]}>
                        {orientation.label}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        }/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  titleContainer: {
    minWidth: 60,
    textAlign: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  orientationList: {
    borderTopWidth: 0.5
  },
  orientationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  orientationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioButton: {
    width: 30,
    height: 30,
    borderRadius: 30,
    borderWidth: 3,
    marginRight: 20,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 12,
  },
  orientationTextContainer: {
    flex: 1,
  },
  orientationText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
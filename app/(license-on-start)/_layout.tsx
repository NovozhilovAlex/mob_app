import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  ScrollView,
  View, Text, TouchableOpacity,
} from 'react-native';
import PageTitle from "@/src/components/PageTitle";
import {useTranslation} from "react-i18next";
import {DefaultBackground} from "@/src/components/DefaultBackground";
import PageWithTitle from "@/src/components/PageWithTitle";
import {
  FormatText
} from "@/src/components/FormatTextView";
import {getLicenseAgreementRus} from "@/src/locales/licenseAgreementRus";
import {getLicenseAgreementEng} from "@/src/locales/licenseAgreementEng";
import FormatTextView from "@/src/components/FormatTextView";
import {AppColors} from "@/src/constants/appColors";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import { BackHandler } from 'react-native';
import {licenseAgreementLinks} from "@/src/locales/licenseAgreementLinks";
import OrientationConfig from "@/src/components/OrientationConfig";

export default function LicenseOnStart() {
  const { t } = useTranslation();
  const {nightMode, isLicenseAgreementAccepted, acceptLicenseAgreement, notAcceptLicenseAgreement} = useAppSettingsStore();
  const links = licenseAgreementLinks();

  const [formatText, setFormatText] = useState<FormatText>({
    headers: []
  });

  const currentLanguage = t('common.currentLanguage');
  useEffect(()=>{
    setFormatText(
      currentLanguage === 'rus'
        ? getLicenseAgreementRus()
        : getLicenseAgreementEng()
    );
  }, [currentLanguage]);

  function onAccept() {
    console.log('Accepting');
    acceptLicenseAgreement();
  }

  function onNotAccept() {
    console.log('Not Accepting');
    notAcceptLicenseAgreement();
    BackHandler.exitApp();
  }

  return (
    <View style={{flex: 1}}>
      <OrientationConfig/>
      <PageWithTitle
        title={<PageTitle title={t('info.licenseAgreement.title')} isCloseDisable={true}/>}
        background={<DefaultBackground/>}
        content={
          <View style={{flex: 1}}>
            <ScrollView
              style={styles.content}>
              <FormatTextView formatText={formatText} links={links} />
            </ScrollView>
            <View style={[styles.buttonsContainer]}>
              <TouchableOpacity onPress={onAccept}
                                style={[styles.buttonContainer,
                                  {
                                    borderRightWidth: 1.5,
                                    borderLeftWidth: 3,
                                    borderColor: nightMode ? AppColors.dark.borderColor : AppColors.light.borderColor
                                  }]}>
                <Text style={[styles.textStyle,
                  { color: nightMode ? '#fff' : '#000'}]}>{t('info.licenseAgreement.accept')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onNotAccept}
                                style={[styles.buttonContainer,{
                                  borderLeftWidth: 1.5,
                                  borderRightWidth: 3,
                                  borderColor: nightMode ? AppColors.dark.borderColor : AppColors.light.borderColor
                                }]}>
                <Text style={[styles.textStyle,
                  { color: nightMode ? '#fff' : '#000'}]}>{t('info.licenseAgreement.notAccept')}</Text>
              </TouchableOpacity>
            </View>

          </View>
        }/>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  buttonsContainer: {
    height: 70,
    flexDirection: 'row'
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: 'black',
  },
  textStyle: {
    fontWeight: 'bold',
    fontSize: 16,
  }
});
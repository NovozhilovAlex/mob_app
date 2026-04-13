import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  ScrollView,
  Linking, View, Text, TouchableOpacity, Alert,
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
import {licenseAgreementLinks} from "@/src/locales/licenseAgreementLinks";
import OrientationConfig from "@/src/components/OrientationConfig";

export default function LicenseAgreement() {
  const {t} = useTranslation();
  const links = licenseAgreementLinks();

  const [formatText, setFormatText] = useState<FormatText>({
    headers: []
  });

  const currentLanguage = t('common.currentLanguage');
  useEffect(() => {
    setFormatText(
      currentLanguage === 'rus'
        ? getLicenseAgreementRus()
        : getLicenseAgreementEng()
    );
  }, [currentLanguage]);

  return (
    <View style={{flex: 1}}>
      <OrientationConfig/>
      <PageWithTitle
        title={<PageTitle title={t('info.licenseAgreement.title')}/>}
        background={<DefaultBackground/>}
        content={
          <View style={{flex: 1}}>
            <ScrollView
              style={styles.content}>
              <FormatTextView formatText={formatText} links={links}/>
            </ScrollView>
          </View>
        }/>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20
  }
});
import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  ScrollView, View,
} from 'react-native';
import PageTitle from "@/src/components/PageTitle";
import {useTranslation} from "react-i18next";
import PageWithTitle from "@/src/components/PageWithTitle";
import {DefaultBackground} from "@/src/components/DefaultBackground";
import FormatTextView, {FormatText} from "@/src/components/FormatTextView";
import {getAuthenticityRus} from "@/src/locales/AuthenticityRus";
import {getAuthenticityEng} from "@/src/locales/AuthenticityEng";
import OrientationConfig from "@/src/components/OrientationConfig";

export default function Authenticity() {
  const {t} = useTranslation();

  const [formatText, setFormatText] = useState<FormatText>({
    headers: []
  });

  const currentLanguage = t('common.currentLanguage');
  useEffect(() => {
    setFormatText(
      currentLanguage === 'rus'
        ? getAuthenticityRus()
        : getAuthenticityEng()
    );
  }, [currentLanguage]);

  return (
    <View style={{flex: 1}}>
      <OrientationConfig/>
      <PageWithTitle
        title={<PageTitle title={t('info.howCheckAuthenticity.title')}/>}
        background={<DefaultBackground/>}
        content={
          <ScrollView
            style={styles.content}>
            <FormatTextView formatText={formatText}/>
          </ScrollView>
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
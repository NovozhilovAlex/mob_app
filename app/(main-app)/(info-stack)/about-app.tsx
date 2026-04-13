import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  ScrollView,
  Linking, View,
} from 'react-native';
import PageTitle from "@/src/components/PageTitle";
import {useTranslation} from "react-i18next";
import PageWithTitle from "@/src/components/PageWithTitle";
import {DefaultBackground} from "@/src/components/DefaultBackground";
import FormatTextView, {FormatText} from "@/src/components/FormatTextView";
import {getAboutAppRus} from "@/src/locales/AboutAppRus";
import {getAboutAppEng} from "@/src/locales/AboutAppEng";
import OrientationConfig from "@/src/components/OrientationConfig";

export default function AboutApp() {

  const LINKS: Record<string, string> = {
    CbrBanknotesLink: "http://www.cbr.ru/cash_circulation/banknotes/5000rub/",
    CbrLink: "http://www.cbr.ru",
    EngCbrBanknotesLink: "http://www.cbr.ru/eng/cash_circulation/banknotes/5000rub/",
    EngCbrLink: "http://www.cbr.ru/eng/",
    GoznakLink: "http://goznak.ru/",
    EngGoznakLink: "http://goznak.ru/en/"
  };

  const { t } = useTranslation();

  const [formatText, setFormatText] = useState<FormatText>({
    headers: []
  });

  const currentLanguage = t('common.currentLanguage');
  useEffect(()=>{
    setFormatText(
      currentLanguage === 'rus'
        ? getAboutAppRus()
        : getAboutAppEng()
    );
  }, [currentLanguage]);

  return (
    <View style={{flex: 1}  }>
      <OrientationConfig/>
      <PageWithTitle
        title={<PageTitle title={t('info.aboutApp.title')}/>}
        background={<DefaultBackground/>}
        content={
          <ScrollView
            style={styles.content}>
            <FormatTextView formatText={formatText} links={LINKS} />
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
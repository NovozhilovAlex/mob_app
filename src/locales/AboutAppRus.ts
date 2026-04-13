import {
  createHeader, createLink,
  createParagraph,
  createSubHeader, createText,
  createTextParagraph,
  FormatText
} from "@/src/components/FormatTextView";
import DeviceInfo from "react-native-device-info";

export function getAboutAppRus(): FormatText {
  const appVersion = DeviceInfo.getVersion();
  return {
    headers: [
      createHeader('Банкноты Банка России',
        [
          createSubHeader(`Версия ${appVersion}`,
            [
              createTextParagraph('Мобильное приложение содержит информацию, которая поможет самостоятельно определить подлинность банкнот Банка России, находящихся в обращении Российской Федерации, без использования специализированного оборудования.'),
              createTextParagraph('Приложение предоставляет возможность отсканировать визуальный образ банкноты Банка России при помощи камеры мобильного устройства; определяет номинал и год модификации представленной банкноты, наличие некоторых защитных признаков на банкнотах номиналом 1000 и 5000 рублей модификации 2010 года и 2000 рублей образца 2017 года; демонстрирует в анимированной интерактивной форме проявление публичных защитных признаков банкноты, контролируемых на просвет, при увеличении, на ощупь или при изменении угла наблюдения.'),
              createTextParagraph('Приложение не гарантирует точность определения подлинности банкнот.'),
              createParagraph([
                createText('Узнать больше о российских банкнотах и монетах можно на сайте '),
                createLink('Банка России', 'CbrBanknotesLink'),
                createText('.')
              ]),
              createParagraph([
                createText('Разработано '),
                createLink('АО «Гознак»', 'GoznakLink'),
                createText(' для '),
                createLink('Банка России', 'CbrLink'),
                createText('.')
              ])
            ]),
        ]
      )
    ]
  }
}
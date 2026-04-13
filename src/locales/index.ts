import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

// Функция для получения языка системы с правильной типизацией
const getSystemLanguage = (): 'rus' | 'eng' => {
  try {
    // Получаем массив локалей пользователя
    const locales = getLocales();

    // Гарантированно содержит хотя бы 1 элемент
    if (locales && locales.length > 0) {
      const primaryLocale = locales[0];

      // Проверяем languageCode (предпочтительный способ)
      if (primaryLocale.languageCode?.toLowerCase() === 'ru') {
        return 'rus';
      }

      // Проверяем languageTag как запасной вариант
      if (primaryLocale.languageTag?.toLowerCase().startsWith('ru')) {
        return 'rus';
      }

      // Также можем проверить regionCode для некоторых случаев
      if (primaryLocale.regionCode?.toLowerCase() === 'ru') {
        return 'rus';
      }
    }
  } catch (error) {
    console.log('Error detecting system language for i18n:', error);
  }

  return 'rus';
};

const resources = {
  rus: {
    translation: {
      drawer: {
        main: 'Главная',
        camera: 'Распознать',
        info: 'Информация',
        settings: 'Настройки',
      },
      common: {
        appName: 'Банкноты Банка России',
        cancel: 'Отмена',
        openSettings: 'Открыть настройки',
        save: 'Сохранить',
        back: 'Назад',
        loading: 'Загрузка...',
        error: 'Ошибка',
        success: 'Успешно',
        rubles: 'рублей',
        currentLanguage: 'rus'
      },
      signs:{
        names: {
          lumen: 'На просвет',
          loupe: 'С лупой',
          incline: 'При наклоне',
          touch: 'На ощупь'
        },
        manualModeNames:{
          lumen: 'Проверьте на просвет',
          loupe: 'Проверьте с лупой',
          incline: 'Проверьте при наклоне',
          touch: 'Проверьте на ощупь'
        }
      },
      settings: {
        title: 'Настройки',
        language: 'Язык',
        languages: {
          auto: 'Авто',
          russian: 'Русский',
          english: 'Английский',
        },
        orientation: {
          title: 'Ориентация дисплея',
          auto: 'Авто',
          portrait: 'Вертикальная',
          landscape: 'Горизонтальная',
        },
        notifications: {
          title: 'Настройки уведомлений',
          success: 'Успешно',
          enabled: 'Уведомления включены',
          permissionDenied: 'Разрешение не получено',
          openSettings: 'Вы можете включить уведомления в настройках приложения',
        },
        nightMode: 'Ночной режим',
        tips: 'Подсказки',
        audioRecognition: 'Аудио распознавание',
      },
      info: {
        title: 'Информация',
        instruction: 'Инструкция',
        howCheckAuthenticity:
          {
            title: 'Рекомендации по определению подлинности',
            text1: 'На банкнотах Банка России присутствуют публичные защитные элементы четырех типов, различающиеся по способу проверки:\n' +
              '    • на просвет;\n' +
              '    • при увеличении;\n' +
              '    • при наклоне;\n' +
              '    • на ощупь.',
            text2: 'К элементам, определяемым на просвет, относятся:\n' +
              '    • водяной знак;\n' +
              '    • защитная нить;\n' +
              '    • совмещающиеся изображения;\n' +
              '    • микроперфорация.',
            text3: 'При увеличении на банкноте можно увидеть микротексты и мелкие графические изображения.',
            text4: 'Некоторые защитные элементы становятся видимыми при наклоне банкноты или изменяют свой внешний вид при изменении угла наблюдения. К ним относятся:\n' +
              '    • цветопеременный элемент;\n' +
              '    • скрытое изображение;\n' +
              '    • элемент, выполненный оптически-переменной краской;\n' +
              '    • изображение на защитной нити;\n' +
              '    • голограмма.',
            text5: 'Также банкноты содержат элементы с повышенным рельефом, воспринимаемым на ощупь:\n' +
              '    • слова «БИЛЕТ БАНКА РОССИИ»;\n' +
              '    • тактильные метки для людей с ослабленным зрением;\n' +
              '    • штрихи и тонкие линии по краям банкноты.',
            text6: 'Для надежного определения подлинности банкноты необходимо проверить не менее трех защитных элементов. Желательно использовать разные способы проверки.'
          },
        news: 'Новости',
        licenseAgreement: {
          title: 'Лицензионное соглашение и условия эксплуатации',
          accept: 'Принимаю',
          notAccept: 'Не принимаю'
        },
        aboutApp: {
          title: 'О приложении',
          text1: 'Банкноты Банка России',
          text2: 'Версия ',
          text3: 'Мобильное приложение содержит информацию, которая поможет самостоятельно определить подлинность банкнот Банка России, находящихся в обращении Российской Федерации, без использования специализированного оборудования.',
          text4: 'Приложение предоставляет возможность отсканировать визуальный образ банкноты Банка России при помощи камеры мобильного устройства; определяет номинал и год модификации представленной банкноты, наличие некоторых защитных признаков на банкнотах номиналом 1000 и 5000 рублей модификации 2010 года и 2000 рублей образца 2017 года; демонстрирует в анимированной интерактивной форме проявление публичных защитных признаков банкноты, контролируемых на просвет, при увеличении, на ощупь или при изменении угла наблюдения.',
          text5: 'Приложение не гарантирует точность определения подлинности банкнот.',
          text6: 'Узнать больше о российских банкнотах и монетах можно на сайте ',
          linkCBBnk: 'Банка России',
          text7: '.',
          text8: 'Разработано ',
          linkGZ: 'АО «Гознак»',
          text9: ' для ',
          linkCBMain: 'Банка России',
          text10: '.',
          linkBBRBnkUrl: 'http://www.cbr.ru/cash_circulation/banknotes/5000rub/',
          linkGZUrl: 'http://goznak.ru/',
          linkCBMainUrl: 'http://www.cbr.ru'
        },
      },
      camera:{
        recognizeResultTitle: 'Результат распознавания',
        openModification: 'УЗНАТЬ О ПРИЗНАКАХ',
        openSignCheck: 'ОПРЕДЕЛИТЬ ПРИЗНАКИ',
        repeat: 'ПОВТОРИТЬ',
        tryAgain: 'ДРУГАЯ БАНКНОТА',
        autoDetectDescription: 'Распознавание банкноты',
        moveCameraOnBnk: 'Наведите камеру на банкноту'
      },
      signCheck:{
        searchSignFeatures: 'Поиск защитных признаков'
      },
      recognizeResult:{
        appNotGuaranteeSignCheck: 'Приложение не гарантирует точность определения подлинности',
        bnkNominalAndModificationFound: 'Номинал и год модификации банкноты определены',
        signsDefined: 'Защитные признаки определены',
        signsNotDefined: "Защитные признаки не определены",
        tryAgain: 'Повторите попытку'
      },
      main:{
        determineNominalBanknote: 'РАСПОЗНАТЬ БАНКНОТУ'
      },
      audio:{
        bnkFound: 'Audio/CheckSign/Rus/BnkFoundRus',
        negative: 'Audio/CheckSign/Rus/NegativeRus',
        positive: 'Audio/CheckSign/Rus/PositiveRus',
        tryAgain: 'Audio/CheckSign/Rus/TryAgainRus',
      }
    },
  },





  eng: {
    translation: {
      drawer: {
        main: 'Home',
        camera: 'Recognize',
        info: 'Info',
        settings: 'Settings',
      },
      common: {
        appName: 'Bank of Russia Banknotes',
        cancel: 'Cancel',
        openSettings: 'Open Settings',
        save: 'Save',
        back: 'Back',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        rubles: 'rubles',
        currentLanguage: 'eng'
      },
      signs:{
        names: {
          lumen: 'Look',
          loupe: 'Magnify',
          incline: 'Tilt',
          touch: 'Feel'
        },
        manualModeNames:{
          lumen: 'Check by looking',
          loupe: 'Check by magnifying',
          incline: 'Check by tilting',
          touch: 'Check by feeling'
        }
      },
      settings: {
        title: 'Settings',
        language: 'Language',
        languages: {
          auto: 'Auto',
          russian: 'Русский',
          english: 'English',
        },
        orientation: {
          title: 'Display Orientation',
          auto: 'Auto',
          portrait: 'Portrait',
          landscape: 'Landscape',
        },
        notifications: {
          title: 'Notification Settings',
          success: 'Success',
          enabled: 'Notifications enabled',
          permissionDenied: 'Permission denied',
          openSettings: 'You can enable notifications in app settings',
        },
        nightMode: 'Night Mode',
        tips: 'Tips',
        audioRecognition: 'Audio Recognition',
      },
      info:{
        title: 'Info',
        instruction: 'Instruction',
        howCheckAuthenticity:
          {
            title: 'How to determine the authenticity of a banknote',
            text1: 'The Bank of Russia banknotes comprise four types of public security features,  which differ in the way they are checked:\n' +
              '    • against the light;\n' +
              '    • with a magnifying glass;\n' +
              '    • by tilting;\n' +
              '    • by feeling.',
            text2: 'The elements checked against the light include:\n' +
              '    • water mark;\n' +
              '    • security thread;\n' +
              '    • see-through images;\n' +
              '    • microperforation.',
            text3: 'With a magnifying glass you can see microtexts and micro-images on the banknote.',
            text4: 'Some security features become visible or change their appearance when you tilt the banknote or change the viewing angle.\n' +
              'These include:\n' +
              '    • multi-coloured element;\n' +
              '    • latent image;\n' +
              '    • element, printed with optically variable ink;\n' +
              '    • image on the security thread;\n' +
              '    • hologram.',
            text5: 'The banknotes also contain elements with raised relief checked by feel:\n' +
              '    • the text «БИЛЕТ БАНКА РОССИИ» (Bank of Russia Banknote);\n' +
              '    • marks for the visually impaired;\n' +
              '    • line marks and fine lines at the edges of the banknote.',
            text6: 'To reliably determine the authenticity of the banknote, at least three security elements must be checked. It is advisable to check different types of security features.'
          },
        news: 'News',
        licenseAgreement: {
          title: 'License Agreement and operational conditions',
          accept: 'Agree',
          notAccept: 'Do not agree'
        },
        aboutApp: {
          title: 'About the app',
          text1: 'Bank of Russia Banknotes',
          text2: 'v. ',
          text3: 'This mobile app contains information that helps you to independently determine the authenticity of the Bank of Russia banknotes in circulation in the Russian Federation, without using specialized equipment.',
          text4: 'The app provides an opportunity to scan the visual image of the Bank of Russia note with the help of a mobile device camera, determines the denomination and the year of modification of the submitted banknote, determines the presence of some security features on the 1000 and 5000 ruble banknote, modification of 2010, and the 2000 ruble banknote of 2017, demonstrates public security features of the banknote checked against the light, under a magnifying glass, by feel or by changing the angle of view in an animated interactive form.',
          text5: 'The application does not guarantee the accuracy of authentication of banknotes.',
          text6: 'Learn more about Russian banknotes and coins on the ',
          linkCBBnk: 'Bank of Russia',
          text7: ' website.',
          text8: 'Developed by ',
          linkGZ: 'JSC "Goznak"',
          text9: ' for the ',
          linkCBMain: 'Bank of Russia',
          text10: '.',
          linkBBRBnkUrl: 'http://www.cbr.ru/eng/cash_circulation/banknotes/5000rub/',
          linkGZUrl: 'http://goznak.ru/en/',
          linkCBMainUrl: 'http://www.cbr.ru/eng/'
        },
      },
      camera:{
        recognizeResultTitle: 'Recognize result',
        openModification: 'LEARN ABOUT\n' +
          'THE FEATURES',
        openSignCheck: 'DEFINE THE FEATURES',
        repeat: 'RETRY',
        tryAgain: 'ANOTHER BANKNOTE',
        autoDetectDescription: 'Banknote recognition',
        moveCameraOnBnk: 'Point the camera at the banknote'
      },
      signCheck:{
        searchSignFeatures: 'Search for security features',
      },
      recognizeResult:{
        appNotGuaranteeSignCheck: 'The application does not guarantee the accuracy of authentication',
        bnkNominalAndModificationFound: 'The denomination and the year of modification of the banknote are defined',
        signsDefined: 'Security features are defined',
        signsNotDefined: "Security features are not defined",
        tryAgain: 'Try again',
      },
      main:{
        determineNominalBanknote: 'RECOGNIZE THE BANKNOTE'
      },
      audio:{
        bnkFound: 'Audio/CheckSign/Eng/BnkFoundEng',
        negative: 'Audio/CheckSign/Eng/NegativeEng',
        positive: 'Audio/CheckSign/Eng/PositiveEng',
        tryAgain: 'Audio/CheckSign/Eng/TryAgainEng',
      }
    },
  },
};

// Определяем начальный язык
const systemLanguage = getSystemLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: systemLanguage,
    fallbackLng: 'eng',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

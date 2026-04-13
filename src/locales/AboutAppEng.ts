import {
  createHeader, createLink,
  createParagraph,
  createSubHeader, createText,
  createTextParagraph,
  FormatText
} from "@/src/components/FormatTextView";
import DeviceInfo from "react-native-device-info";

export function getAboutAppEng(): FormatText {
  const appVersion = DeviceInfo.getVersion();
  return {
    headers: [
      createHeader('Bank of Russia Banknotes',
        [
          createSubHeader(`v. ${appVersion}`,
            [
              createTextParagraph('This mobile app contains information that helps you to independently determine the authenticity of the Bank of Russia banknotes in circulation in the Russian Federation, without using specialized equipment.'),
              createTextParagraph('The app provides an opportunity to scan the visual image of the Bank of Russia note with the help of a mobile device camera, determines the denomination and the year of modification of the submitted banknote, determines the presence of some security features on the 1000 and 5000 ruble banknote, modification of 2010, and the 2000 ruble banknote of 2017, demonstrates public security features of the banknote checked against the light, under a magnifying glass, by feel or by changing the angle of view in an animated interactive form.'),
              createTextParagraph('The application does not guarantee the accuracy of authentication of banknotes.'),

              createParagraph([
                createText('Learn more about Russian banknotes and coins on the '),
                createLink('Bank of Russia', 'EngCbrBanknotesLink'),
                createText(' website.')
              ]),
              createParagraph([
                createText('Developed by '),
                createLink('JSC "Goznak"', 'EngGoznakLink'),
                createText(' for the '),
                createLink('Bank of Russia', 'EngCbrLink'),
                createText('.')
              ])
            ]),
        ]
      )
    ]
  }
}
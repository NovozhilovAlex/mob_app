import {
  createHeader, createLink, createListItem, createListItemText,
  createParagraph, createParagraphList,
  createSubHeader, createText,
  createTextParagraph,
  FormatText
} from "@/src/components/FormatTextView";
import DeviceInfo from "react-native-device-info";

export function getAuthenticityRus(): FormatText {
  return {
    headers: [
      createHeader(undefined,
        [
          createSubHeader(undefined,
            [
              createParagraphList('На банкнотах Банка России присутствуют публичные защитные элементы четырех типов, различающиеся по способу проверки:', [
                createListItemText('•', 'на просвет;'),
                createListItemText('•', 'при увеличении;'),
                createListItemText('•', 'при наклоне;'),
                createListItemText('•', 'на ощупь.'),
              ]),

              createParagraphList('К элементам, определяемым на просвет, относятся:', [
                createListItemText('•', 'водяной знак;'),
                createListItemText('•', 'защитная нить;'),
                createListItemText('•', 'совмещающиеся изображения;'),
                createListItemText('•', 'микроперфорация.'),
              ]),

              createTextParagraph('При увеличении на банкноте можно увидеть микротексты и мелкие графические изображения.'),

              createParagraphList('Некоторые защитные элементы становятся видимыми при наклоне банкноты или изменяют свой внешний вид при изменении угла наблюдения. К ним относятся:', [
                createListItemText('•', 'цветопеременный элемент;'),
                createListItemText('•', 'скрытое изображение;'),
                createListItemText('•', 'элемент, выполненный оптически-переменной краской;'),
                createListItemText('•', 'изображение на защитной нити;'),
                createListItemText('•', 'голограмма.'),
              ]),

              createParagraphList('Также банкноты содержат элементы с повышенным рельефом, воспринимаемым на ощупь:', [
                createListItemText('•', 'слова «БИЛЕТ БАНКА РОССИИ»;'),
                createListItemText('•', 'тактильные метки для людей с ослабленным зрением;'),
                createListItemText('•', 'штрихи и тонкие линии по краям банкноты.'),
              ]),

              createTextParagraph('Для надежного определения подлинности банкноты необходимо проверить не менее трех защитных элементов. Желательно использовать разные способы проверки.')
            ]),
        ]
      )
    ]
  }
}
import {
  createHeader, createLink, createListItemText,
  createParagraph, createParagraphList,
  createSubHeader, createText,
  createTextParagraph,
  FormatText
} from "@/src/components/FormatTextView";
import DeviceInfo from "react-native-device-info";

export function getAuthenticityEng(): FormatText {
  return {
    headers: [
      createHeader(undefined,
        [
          createSubHeader(undefined,
            [
              createParagraphList('The Bank of Russia banknotes comprise four types of public security features,  which differ in the way they are checked:', [
                createListItemText('•', 'against the light;'),
                createListItemText('•', 'with a magnifying glass;'),
                createListItemText('•', 'by tilting;'),
                createListItemText('•', 'by feeling.'),
              ]),

              createParagraphList('The elements checked against the light include:', [
                createListItemText('•', 'water mark;'),
                createListItemText('•', 'security thread;'),
                createListItemText('•', 'see-through images;'),
                createListItemText('•', 'microperforation.'),
              ]),

              createTextParagraph('With a magnifying glass you can see microtexts and micro-images on the banknote.'),

              createTextParagraph('Some security features become visible or change their appearance when you tilt the banknote or change the viewing angle.'),

              createParagraphList('These include:', [
                createListItemText('•', 'multi-coloured element;'),
                createListItemText('•', 'latent image;'),
                createListItemText('•', 'element, printed with optically variable ink;'),
                createListItemText('•', 'image on the security thread;'),
                createListItemText('•', 'hologram.'),
              ]),

              createParagraphList('The banknotes also contain elements with raised relief checked by feel:', [
                createListItemText('•', 'the text «БИЛЕТ БАНКА РОССИИ» (Bank of Russia Banknote);'),
                createListItemText('•', 'marks for the visually impaired;'),
                createListItemText('•', 'line marks and fine lines at the edges of the banknote.'),
              ]),

              createTextParagraph('To reliably determine the authenticity of the banknote, at least three security elements must be checked. It is advisable to check different types of security features.')
            ]),
        ]
      )
    ]
  }
}
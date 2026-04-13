import React from "react";
import {Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {AppColors} from "@/src/constants/appColors";

// 1. Самый мелкий элемент: текст или ссылка
export type TextElement = {
  id: string;
  type: 'text';
  value: string;
} | {
  id: string;
  type: 'link';
  value: string;
  url: string;
};

export interface ListItem {
  id: string;
  key: string;
  elements: TextElement[];
}

// 2. Параграф — массив текстовых элементов
export type Paragraph = {
  id: string;
  type: 'default';
  elements: TextElement[];
} | {
  id: string;
  type: 'list';
  title: string;
  items: ListItem[];
}

// 3. Подзаголовок и его параграфы
export interface SubHeader {
  id: string;
  subtitle: string | undefined;
  paragraphs: Paragraph[];
}

// 4. Основной заголовок и разделы (Верхний уровень)
export interface Header {
  id: string;
  title: string | undefined;
  subHeaders: SubHeader[];
}

// Итоговый тип данных — массив заголовков
export interface FormatText {
  headers: Header[];
}

const generateId = () => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

// 1. Текст
export const createText = (value: string): TextElement => ({
  id: generateId(),
  type: 'text',
  value: value
});

// 1. Ссылка
export const createLink = (value: string, url: string): TextElement => ({
  id: generateId(),
  type: 'link',
  value: value,
  url: url
});

// 1. Список
export const createParagraphList = (value: string, items: ListItem[]): Paragraph => ({
  id: generateId(),
  type: 'list',
  title: value,
  items: items
});

export const createListItem = (key: string, elements: TextElement[]): ListItem => ({
  id: generateId(),
  key: key,
  elements
});

export const createListItemText = (key: string, value: string): ListItem => ({
  id: generateId(),
  key: key,
  elements: [
    createText(value)
  ]
});

// 2. Параграф (группирует текстовые элементы)
export const createParagraph = (elements: TextElement[]): Paragraph => ({
  id: generateId(),
  type: 'default',
  elements
});

// 2. Параграф (группирует текстовые элементы)
export const createTextParagraph = (value: string): Paragraph => ({
  id: generateId(),
  type: 'default',
  elements: [
    createText(value),
  ]
});

// 3. Подзаголовок (содержит параграфы)
export const createSubHeader = (subtitle: string | undefined, paragraphs: Paragraph[] = []): SubHeader => ({
  id: generateId(),
  subtitle,
  paragraphs
});

// 4. Основная секция (верхний уровень)
export const createHeader = (title: string | undefined, subHeaders: SubHeader[] = []): Header => ({
  id: generateId(),
  title,
  subHeaders
});

export default function FormatTextView(props: { formatText: FormatText, links?: Record<string, string> }) {
  const {nightMode} = useAppSettingsStore();

  const onOpenLink = async (link: string) => {
    if (!props.links)
    {
      console.log('Undefined links');
      return;
    }

    const url = props.links[link]

    if (!url)
    {
      console.log('Undefined link: ', link);
      return;
    }

    Alert.alert(
      "Переход по ссылке", // Заголовок
      "Открыть ссылку в браузере?", // Сообщение
      [
        {
          text: "Да",
          onPress: () => Linking.openURL(url).then()
        },
        {
          text: "Нет",
          onPress: () => console.log("Close pressed"),
          style: "cancel" // На iOS выделит кнопку серым
        }
      ]
    );
  };

  return <>
      {props.formatText.headers.map((header) => (
        <View key={header.id}
              style={styles.headerContainer}>
          {header.title && (
            <Text
              style={[
                styles.header,
                { color: nightMode ? '#fff' : '#000'}
              ]}>
              {header.title}
            </Text>
          )}
          {
            header.subHeaders.map((subHeader) => (
              <View key={subHeader.id}
                    style={styles.subHeaderContainer}>
                {subHeader.subtitle && (
                  <Text
                    style={[
                      styles.subHeader,
                      { color: nightMode ? '#fff' : '#000'}
                    ]}>
                    {subHeader.subtitle}
                  </Text>
                )}
                {
                  subHeader.paragraphs.map((paragraph) => (
                    paragraph.type === 'default'
                      ? (
                        <Text
                          key={paragraph.id}
                          style={[
                            styles.paragraph,
                            { color: nightMode ? '#fff' : '#000'}
                          ]}>
                          {
                            paragraph.elements.map((element) => (
                              element.type === 'text'
                                ? (
                                  <Text
                                    key={element.id}
                                    style={[
                                      { color: nightMode ? '#fff' : '#000'}
                                    ]}>
                                    {element.value}
                                  </Text>
                                )
                                : (
                                  <Text key={element.id}
                                    style={[styles.linkText,
                                      {
                                        color: nightMode ? AppColors.dark.linkColor: AppColors.light.linkColor
                                      }
                                    ]}
                                    onPress={() => {
                                      onOpenLink(element.url)
                                    }}>
                                    {element.value}
                                  </Text>
                                )
                            ))
                          }
                        </Text>)
                      : (
                        <View key={paragraph.id}>
                          <Text
                            key={paragraph.id}
                            style={[
                              styles.paragraphListTitle,
                              { color: nightMode ? '#fff' : '#000'}
                            ]}>
                            {paragraph.title}
                          </Text>
                          {
                            paragraph.items.map((listItem) => (
                              <View key={listItem.id}
                                    style={styles.paragraphListItemView}>
                                <Text style={[
                                  styles.paragraphListItemKey,
                                  { color: nightMode ? '#fff' : '#000'}
                                ]}>
                                  {listItem.key}
                                </Text>
                                <Text
                                  style={[
                                    styles.paragraphListItemText,
                                    { flex: 1,
                                      color: nightMode ? '#fff' : '#000'}
                                  ]}>
                                  {
                                    listItem.elements.map((element) => (
                                      element.type === 'text'
                                        ? (
                                          <Text
                                            key={element.id}
                                            style={[
                                              { color: nightMode ? '#fff' : '#000'}
                                            ]}>
                                            {element.value}
                                          </Text>
                                        )
                                        : (
                                          <Text key={element.id}
                                                style={[styles.linkText,
                                                  {
                                                    color: nightMode ? AppColors.dark.linkColor: AppColors.light.linkColor
                                                  }
                                                ]}
                                                onPress={() => {
                                                  onOpenLink(element.url)
                                                }}>
                                            {element.value}
                                          </Text>
                                        )
                                    ))
                                  }
                                </Text>
                              </View>
                            ))
                          }
                        </View>
                      )
                  ))
                }
              </View>
            ))
          }
        </View>

      ))

      }
      </>;
}

const styles = StyleSheet.create({
  paragraph: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 5,
    textAlign: 'justify',
  },
  paragraphListItemView: {
    flexDirection: 'row',
    gap:10
  },
  paragraphListTitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'justify',
  },
  paragraphListItemKey: {
    fontSize: 16,
    minWidth: 16,
    lineHeight: 22,
    textAlign: 'right'
  },
  paragraphListItemText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 3,
    textAlign: 'justify',
  },
  headerContainer: {
    marginBottom: 10,
  },
  header: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'justify',
  },
  subHeaderContainer: {
    marginBottom: 10,
  },
  subHeader: {
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 5,
    textAlign: 'justify',
  },
  linkText: { textDecorationLine: 'underline' },
});
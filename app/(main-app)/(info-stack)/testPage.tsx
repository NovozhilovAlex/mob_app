import React, { useState } from 'react';
import {Modal, StyleSheet, Text, Pressable, View, Alert} from 'react-native';

const QuestionModal = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleAnswer = (answer: string) => {
    console.log("User selected:", answer);
    setModalVisible(false); // Закрываем модальное окно после выбора
  };

  const showAlert = () =>
    Alert.alert(
      "Переход по ссылке", // Заголовок
      "Открыть ссылку в браузере?", // Сообщение
      [
        {
          text: "Да",
          onPress: () => console.log("Нажато Нет")
        },
        {
          text: "Нет",
          onPress: () => console.log("Нажато Да"),
          style: "cancel" // На iOS выделит кнопку серым
        }
      ]
    );

  return (
    <View style={styles.centeredView}>
      {/* Кнопка для вызова модального окна */}
      <Pressable style={styles.buttonOpen} onPress={() =>

        showAlert()

        //setModalVisible(true)
      }>
        <Text style={styles.textStyle}>Задать вопрос</Text>
      </Pressable>

      <Modal
        animationType="fade" // Тип анимации: slide, fade или none
        transparent={true}   // Делает фон под модальным окном прозрачным
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Обработка кнопки "Назад" на Android
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Вы уверены, что хотите продолжить?</Text>

            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.buttonYes]}
                onPress={() => handleAnswer('Yes')}
              >
                <Text style={styles.textStyle}>Да</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.buttonNo]}
                onPress={() => handleAnswer('No')}
              >
                <Text style={styles.textStyle}>Нет</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Затемнение фона при открытом модале
  },
  modalView: {
    margin: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonContainer: {
    flexDirection: 'row', // Располагаем кнопки в ряд
    marginTop: 20,
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginHorizontal: 10,
    minWidth: 80,
  },
  buttonOpen: { backgroundColor: '#F194FF', padding: 10, borderRadius: 10 },
  buttonYes: { backgroundColor: '#2196F3' },
  buttonNo: { backgroundColor: '#FF5252' },
  textStyle: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  modalText: { marginBottom: 15, textAlign: 'center', fontSize: 18 },
});

export default QuestionModal;

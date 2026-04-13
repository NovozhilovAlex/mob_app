import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SwitchItemProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  value: boolean;
  onValueChange: (value: boolean) => void;
  nightMode?: boolean;
}

export default function SwitchItem({
                                     title,
                                     icon,
                                     value,
                                     onValueChange,
                                     nightMode = false,
                                   }: SwitchItemProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderBottomColor: nightMode ? '#ffffff50' : '#00000050'
        }
      ]}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
    >
      <View style={styles.leftContainer}>
        <View style={[
          styles.checkbox,
          {
            borderColor: nightMode ? '#ffffff' : '#000000',
            backgroundColor: nightMode ? '#ffffff' : '#000000',
          }
        ]}>
          {value && (
            <Ionicons
              name="checkmark"
              size={30}
              color={nightMode ? '#000000' : '#ffffff'}
            />
          )}
        </View>

        <Text style={[
          styles.title,
          { color: nightMode ? '#ffffff' : '#000000' }
        ]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 3,
    borderWidth: 0,
    marginRight: 20,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
});

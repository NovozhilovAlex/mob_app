import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingItemProps {
  title: string;
  value?: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  showChevron?: boolean;
  nightMode?: boolean;
}

export default function SettingItem({
                                      title,
                                      value,
                                      onPress,
                                      icon,
                                      showChevron = true,
                                      nightMode = false,
                                    }: SettingItemProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderBottomColor: nightMode ? '#ffffff50' : '#00000050'
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftContainer}>
        <Text style={[
          styles.title,
          { color: nightMode ? '#ffffff' : '#000000' }
        ]}>
          {title}
        </Text>
      </View>

      <View style={styles.rightContainer}>
        {value && (
          <Text style={[
            styles.value,
            { color: nightMode ? '#ffffff' : '#000000' }
          ]}>
            {value}
          </Text>
        )}
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={28}
            color={nightMode ? '#ffffff' : '#000000'}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
});

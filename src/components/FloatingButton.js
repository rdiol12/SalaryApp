import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme as T } from '../constants/theme';

export default function FloatingButton({ isVisible, onPress }) {
  if (!isVisible) return null;

  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name="add" size={32} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 36,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: T.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

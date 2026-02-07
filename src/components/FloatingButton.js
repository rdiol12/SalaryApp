import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function FloatingButton({ isVisible, onPress }) {
  if (!isVisible) return null;
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <Text style={styles.fabText}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', bottom: 40, right: 30, width: 65, height: 65, borderRadius: 33, backgroundColor: '#00adf5', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowOpacity: 0.3 },
  fabText: { fontSize: 40, color: '#fff', marginBottom: 5 }
});

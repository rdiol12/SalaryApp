import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';

export default function SettingsModal({ visible, config, onSave, onClose }) {
  // שימוש בסטייט מקומי כדי למנוע רינדור של App.js בזמן הקלדה
  const [localConfig, setLocalConfig] = useState(config);

  // עדכון הסטייט המקומי כשהמודל נפתח מחדש
  useEffect(() => {
    if (visible) {
      setLocalConfig(config);
    }
  }, [visible, config]);

  const handleChange = (field, value) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Text style={styles.title}>הגדרות שכר ופרופיל</Text>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>שם משתמש</Text>
              <TextInput 
                style={styles.input} 
                value={localConfig.userName}
                onChangeText={(val) => handleChange('userName', val)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>שכר שעתי (₪)</Text>
              <TextInput 
                style={styles.input} 
                value={localConfig.hourlyRate}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('hourlyRate', val)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>יעד נטו חודשי (₪)</Text>
              <TextInput 
                style={styles.input} 
                value={localConfig.monthlyGoal}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('monthlyGoal', val)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>נקודות זיכוי מס</Text>
              <TextInput 
                style={styles.input} 
                value={localConfig.creditPoints}
                keyboardType="numeric"
                onChangeText={(val) => handleChange('creditPoints', val)}
              />
            </View>

            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={() => onSave(localConfig)}
            >
              <Text style={styles.saveText}>שמור שינויים</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>ביטול</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#333', alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#aaa', marginBottom: 8, textAlign: 'right' },
  input: { backgroundColor: '#1c1c1e', color: '#fff', padding: 15, borderRadius: 10, textAlign: 'right', fontSize: 16 },
  saveBtn: { backgroundColor: '#00adf5', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeBtn: { padding: 15, alignItems: 'center', marginTop: 10 },
  closeText: { color: '#aaa' }
});

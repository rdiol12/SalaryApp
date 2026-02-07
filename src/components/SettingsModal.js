import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function SettingsModal({ visible, config, onSave, onClose }) {
  const [localConfig, setLocalConfig] = useState(config);
  useEffect(() => { if (visible) setLocalConfig(config); }, [visible, config]);

  const handleChange = (f, v) => setLocalConfig(prev => ({ ...prev, [f]: v }));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          
          {/* כותרת עליונה מעוצבת */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>ביטול</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>הגדרות חשבון</Text>
            <TouchableOpacity onPress={() => onSave(localConfig)}>
              <Text style={styles.saveTextTop}>שמור</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* קבוצה 1: פרופיל ושכר */}
            <Text style={styles.sectionLabel}>פרופיל ובסיס</Text>
            <View style={styles.card}>
              <SettingInput 
                label="שם משתמש" 
                value={localConfig.userName} 
                onChange={(v) => handleChange('userName', v)} 
              />
              <View style={styles.divider} />
              <SettingInput 
                label="שכר שעתי (₪)" 
                value={localConfig.hourlyRate} 
                onChange={(v) => handleChange('hourlyRate', v)} 
                type="numeric" 
              />
            </View>

            {/* קבוצה 2: תנאים סוציאליים */}
            <Text style={styles.sectionLabel}>תנאים והוצאות</Text>
            <View style={styles.card}>
              <SettingInput 
                label="נסיעות יומיות (₪)" 
                value={localConfig.travelDaily} 
                onChange={(v) => handleChange('travelDaily', v)} 
                type="numeric" 
              />
              <View style={styles.divider} />
              <SettingInput 
                label="דקות הפסקה (מעל 6 שעות)" 
                value={localConfig.breakDeduction} 
                onChange={(v) => handleChange('breakDeduction', v)} 
                type="numeric" 
              />
            </View>

            {/* קבוצה 3: מחזור שכר - גלגלת מעוצבת */}
            <Text style={styles.sectionLabel}>הגדרות תשלום</Text>
            <View style={styles.card}>
              <View style={styles.pickerRow}>
                <Text style={styles.label}>יום תחילת חודש</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={localConfig.salaryStartDay}
                    onValueChange={(v) => handleChange('salaryStartDay', v)}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                      <Picker.Item key={d} label={`${d}`} value={d.toString()} color={Platform.OS === 'ios' ? '#fff' : '#fff'} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// רכיב פנימי לשורה של הגדרה
const SettingInput = ({ label, value, onChange, type = "default" }) => (
  <View style={styles.inputRow}>
    <TextInput 
      style={styles.input} 
      value={value} 
      keyboardType={type} 
      onChangeText={onChange}
      placeholderTextColor="#444"
    />
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }, // שחור עמוק
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#222' 
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  cancelText: { color: '#ff3b30', fontSize: 17 },
  saveTextTop: { color: '#00adf5', fontSize: 17, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionLabel: { 
    color: '#8e8e93', 
    fontSize: 13, 
    textTransform: 'uppercase', 
    marginBottom: 8, 
    marginTop: 24, 
    marginRight: 8,
    textAlign: 'right'
  },
  card: { 
    backgroundColor: '#1c1c1e', 
    borderRadius: 12, 
    overflow: 'hidden' 
  },
  inputRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    minHeight: 50
  },
  label: { color: '#fff', fontSize: 16 },
  input: { 
    color: '#00adf5', 
    fontSize: 16, 
    textAlign: 'left', 
    flex: 1, 
    marginRight: 20 
  },
  divider: { height: 0.5, backgroundColor: '#38383a', marginLeft: 16 },
  pickerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    height: 50
  },
  pickerWrapper: { width: 100, justifyContent: 'center' },
  picker: { color: '#00adf5' },
  pickerItem: { fontSize: 16 }
});

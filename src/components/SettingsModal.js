// בתוך ה-ScrollView ב-SettingsModal.js

<Text style={styles.sectionLabel}>הגדרות שכר ומחזור</Text>
<View style={styles.card}>
  {/* הגדרת מחזור חודשי */}
  <View style={styles.inputRow}>
    <View style={styles.rangeWrapper}>
      <TextInput 
        style={styles.rangeInput} 
        value={localConfig.salaryEndDay} 
        onChangeText={(v) => handleChange('salaryEndDay', v)}
        keyboardType="numeric"
      />
      <Text style={styles.rangeText}> עד ה-</Text>
      <TextInput 
        style={styles.rangeInput} 
        value={localConfig.salaryStartDay} 
        onChangeText={(v) => handleChange('salaryStartDay', v)}
        keyboardType="numeric"
      />
      <Text style={styles.rangeText}>מה-</Text>
    </View>
    <Text style={styles.label}>מחזור חישוב</Text>
  </View>

  <View style={styles.divider} />

  {/* הגדרת הפסקה */}
  <View style={styles.switchRow}>
    <Switch 
      value={localConfig.isBreakDeducted} 
      onValueChange={(v) => handleChange('isBreakDeducted', v)}
      trackColor={{ false: "#3a3a3c", true: "#4cd964" }}
    />
    <Text style={styles.label}>האם לקזז זמן הפסקה?</Text>
  </View>

  {localConfig.isBreakDeducted && (
    <View style={styles.inputRow}>
      <TextInput 
        style={styles.input} 
        value={localConfig.breakDeduction} 
        onChangeText={(v) => handleChange('breakDeduction', v)}
        keyboardType="numeric"
      />
      <Text style={styles.label}>דקות להורדה (מעל 6 שעות)</Text>
    </View>
  )}
</View>

// הוסף Switch לייבוא מ-react-native
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Switch } from 'react-native';

// בתוך ה-Component:
const [salaryEndDay, setSalaryEndDay] = useState(config.salaryEndDay || '30');
const [isBreakDeducted, setIsBreakDeducted] = useState(config.isBreakDeducted ?? true);

// בתוך ה-JSX (מתחת ליעד חודשי):
<Text style={styles.sectionLabel}>הגדרות שכר והפסקה</Text>
<View style={styles.card}>
  <View style={styles.row}>
    <Switch 
      value={isBreakDeducted} 
      onValueChange={setIsBreakDeducted}
      trackColor={{ false: "#767577", true: "#4cd964" }}
    />
    <Text style={styles.label}>האם לנכות זמן הפסקה?</Text>
  </View>
  
  {isBreakDeducted && (
    <View style={styles.inputRow}>
      <TextInput 
        style={styles.input} 
        value={tempConfig.breakDeduction} 
        onChangeText={(v) => setTempConfig({...tempConfig, breakDeduction: v})}
        keyboardType="numeric"
      />
      <Text style={styles.label}>דקות הפסקה (מעל 6 ש' עבודה)</Text>
    </View>
  )}
  
  <View style={styles.divider} />
  
  <View style={styles.inputRow}>
    <View style={styles.rangeContainer}>
      <TextInput 
        style={[styles.input, {width: 40}]} 
        value={salaryEndDay} 
        onChangeText={setSalaryEndDay}
        keyboardType="numeric"
      />
      <Text style={styles.rangeText}> עד </Text>
      <TextInput 
        style={[styles.input, {width: 40}]} 
        value={tempConfig.salaryStartDay} 
        onChangeText={(v) => setTempConfig({...tempConfig, salaryStartDay: v})}
        keyboardType="numeric"
      />
    </View>
    <Text style={styles.label}>טווח חישוב חודשי (ימים)</Text>
  </View>
</View>

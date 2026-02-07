import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // שימוש באייקונים של אקספו

export default function Header({ config, viewMode, setViewMode, onOpenSettings }) {
  
  // פונקציית עזר ליצירת כפתור בתפריט העליון
  const TabButton = ({ mode, icon, label }) => (
    <TouchableOpacity 
      style={[styles.tab, viewMode === mode && styles.activeTab]} 
      onPress={() => setViewMode(mode)}
    >
      <Ionicons 
        name={icon} 
        size={18} 
        color={viewMode === mode ? '#fff' : '#8e8e93'} 
      />
      <Text style={[styles.tabText, viewMode === mode && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.safeArea}>
      <View style={styles.topRow}>
        {/* כפתור הגדרות */}
        <TouchableOpacity onPress={onOpenSettings} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color="#00adf5" />
        </TouchableOpacity>

        {/* ברכת שלום אישית */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>שלום, {config.userName || 'אורח'}</Text>
          <Text style={styles.subText}>ניהול שכר חכם</Text>
        </View>
      </View>

      {/* בורר מצבי תצוגה */}
      <View style={styles.tabContainer}>
        <TabButton mode="stats" icon="bar-chart" label="סטטיסטיקה" />
        <TabButton mode="list" icon="list" label="רשימה" />
        <TabButton mode="calendar" icon="calendar" label="לוח שנה" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#000',
    paddingTop: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  welcomeContainer: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subText: {
    color: '#8e8e93',
    fontSize: 12,
  },
  settingsBtn: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#3a3a3c',
  },
  tabText: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
});

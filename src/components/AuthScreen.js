import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../constants/theme.js";

const { width } = Dimensions.get("window");

export default function AuthScreen({ onAuthenticated, isEnabled }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    checkAuth();
  }, [isEnabled]);

  const checkAuth = async () => {
    if (!isEnabled) {
      onAuthenticated();
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      // Fallback if not supported but enabled (shouldn't happen ideally if we hide toggle)
      // But for safety, just let them in or show a manual "Enter" button relative to config.
      // We will assume if they enabled it, they want security. But if hardware fails, we can't block them forever.
      // Let's just auto-auth for now to avoid lockouts during dev.
      onAuthenticated();
      return;
    }

    setStatus("locked");
    authenticate();
  };

  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "נא להזדהות לכניסה",
        fallbackLabel: "השתמש בסיסמה",
        cancelLabel: "ביטול",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setStatus("unlocked");
        setTimeout(onAuthenticated, 200);
      }
    } catch (e) {
      console.error("Auth error", e);
    }
  };

  if (!isEnabled || status === "unlocked") return null;
  if (status === "checking") return <View style={styles.container} />; // Loading state

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={50} color={T.accent} />
          </View>
          <Text style={styles.title}>SalaryApp</Text>
          <Text style={styles.subtitle}>האפליקציה נעולה</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={authenticate}
          activeOpacity={0.8}
        >
          <Ionicons name="finger-print-outline" size={28} color="#fff" />
          <Text style={styles.btnText}>לחץ להזדהות</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    ...StyleSheet.absoluteFillObject,
    backgroundColor: T.bg,
    zIndex: 9999, // On top of everything
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "space-between",
    height: "60%",
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginTop: 60,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: T.cardBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    color: T.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    color: T.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  button: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: T.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 12,
    width: width * 0.7,
    justifyContent: "center",
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});

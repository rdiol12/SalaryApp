import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { darkTheme as T } from "../constants/theme.js";

const { width } = Dimensions.get("window");

const TABS = [
  {
    mode: "yearly",
    icon: "trophy-outline",
    activeIcon: "trophy",
    label: "שנתי",
  },
  {
    mode: "stats",
    icon: "bar-chart-outline",
    activeIcon: "bar-chart",
    label: "חודשי",
  },
  { mode: "list", icon: "list-outline", activeIcon: "list", label: "רשימה" },
  {
    mode: "calendar",
    icon: "calendar-outline",
    activeIcon: "calendar",
    label: "לוח",
  },
];

export default function BottomTabs({ viewMode, setViewMode, enabledModules = {} }) {
  const insets = useSafeAreaInsets();
  const bottomMargin = Platform.OS === "ios" ? insets.bottom || 20 : 20;

  const visibleTabs = TABS.filter((t) => enabledModules[t.mode] !== false);

  const handlePress = (mode) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setViewMode(mode);
  };

  return (
    <View style={[styles.wrapper, { bottom: bottomMargin }]}>
      <BlurView
        intensity={T.glassIntensity}
        tint="light"
        style={styles.container}
      >
        {visibleTabs.map((tab) => {
          const active = viewMode === tab.mode;
          return (
            <TouchableOpacity
              key={tab.mode}
              style={styles.tab}
              onPress={() => handlePress(tab.mode)}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.iconContainer,
                  active && styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={active ? tab.activeIcon : tab.icon}
                  size={22}
                  color={active ? T.accent : T.textSecondary}
                />
              </View>
              <Text style={[styles.label, active && styles.activeLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    flexDirection: "row-reverse",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "space-between",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  iconContainer: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  activeIconContainer: {
    backgroundColor: "rgba(62, 142, 208, 0.1)",
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: T.textSecondary,
  },
  activeLabel: {
    color: T.accent,
    fontWeight: "800",
  },
});

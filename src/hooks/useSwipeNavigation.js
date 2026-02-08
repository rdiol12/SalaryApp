import { useRef, useCallback } from "react";
import { Animated } from "react-native";
import * as Haptics from "expo-haptics";

const SWIPE_THRESHOLD = 50; // Minimum distance to trigger swipe
const VELOCITY_THRESHOLD = 0.3; // Minimum velocity for quick swipes
const VERTICAL_LIMIT = 40; // Max vertical movement allowed

/**
 * Custom hook for view navigation via horizontal swipes.
 * Provides velocity-based detection, animated translation, and haptic feedback.
 *
 * @param {string[]} views - Ordered list of view names
 * @param {string} currentView - Currently active view
 * @param {function} setCurrentView - Function to change view
 * @returns {object} - { translateX, handleGestureEvent, handleGestureStateChange }
 */
export default function useSwipeNavigation(views, currentView, setCurrentView) {
  const translateX = useRef(new Animated.Value(0)).current;
  const currentIndex = views.indexOf(currentView);

  const triggerHaptic = useCallback((type = "selection") => {
    try {
      if (type === "impact") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (type === "warning") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.selectionAsync();
      }
    } catch (e) {
      // Haptics not available
    }
  }, []);

  const resetPosition = useCallback(
    (toValue = 0) => {
      Animated.spring(translateX, {
        toValue,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    },
    [translateX],
  );

  const handleGestureEvent = useCallback(
    ({ nativeEvent }) => {
      const { translationX, translationY } = nativeEvent;

      // Ignore if too vertical
      if (Math.abs(translationY) > VERTICAL_LIMIT) return;

      // Limit drag at edges with resistance
      const isAtStart = currentIndex === 0 && translationX > 0;
      const isAtEnd = currentIndex === views.length - 1 && translationX < 0;

      if (isAtStart || isAtEnd) {
        // Apply rubber band effect at edges (1/3 resistance)
        translateX.setValue(translationX / 3);
      } else {
        // Clamp translation to reasonable range
        const clampedX = Math.max(-150, Math.min(150, translationX));
        translateX.setValue(clampedX);
      }
    },
    [currentIndex, views.length, translateX],
  );

  const handleGestureStateChange = useCallback(
    ({ nativeEvent }) => {
      const { state, translationX, translationY, velocityX } = nativeEvent;

      // Only process on gesture end (state 5 = END)
      if (state !== 5) return;

      // Ignore if too vertical
      if (Math.abs(translationY) > VERTICAL_LIMIT) {
        resetPosition();
        return;
      }

      // Determine swipe direction using both distance and velocity
      // Quick swipes with velocity count even if distance is shorter
      const isQuickSwipe = Math.abs(velocityX) > VELOCITY_THRESHOLD;
      const minDistance = isQuickSwipe ? 30 : SWIPE_THRESHOLD;

      const shouldSwipe = Math.abs(translationX) >= minDistance;

      if (!shouldSwipe) {
        resetPosition();
        return;
      }

      // Determine direction (RTL-aware: left = next, right = prev)
      const direction = translationX < 0 ? 1 : -1;
      const nextIndex = currentIndex + direction;

      // Check bounds
      if (nextIndex < 0 || nextIndex >= views.length) {
        // At edge - bounce back with warning haptic
        triggerHaptic("warning");
        resetPosition();
        return;
      }

      // Navigate to new view
      triggerHaptic("impact");
      setCurrentView(views[nextIndex]);
      resetPosition();
    },
    [currentIndex, views, setCurrentView, resetPosition, triggerHaptic],
  );

  return {
    translateX,
    handleGestureEvent,
    handleGestureStateChange,
    currentIndex,
    isAtStart: currentIndex === 0,
    isAtEnd: currentIndex === views.length - 1,
  };
}

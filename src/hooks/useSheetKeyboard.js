import { useEffect, useRef, useState, useCallback } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * Keeps a text field near the bottom of a full-height bottom sheet visible
 * while the keyboard is open.
 *
 * The sheets use keyboardBehavior="extend" so they no longer move up by the
 * keyboard height (that shift is what made the content jump). Instead the
 * scroll content gets bottom padding equal to the keyboard, and the focused
 * field is scrolled into view.
 */
export default function useSheetKeyboard() {
  const scrollRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const pendingScroll = useRef(false);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKeyboardHeight(e?.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Scroll after the padding has been applied, so the end is below the field.
  useEffect(() => {
    if (keyboardHeight > 0 && pendingScroll.current) {
      pendingScroll.current = false;
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [keyboardHeight]);

  const scrollToBottomField = useCallback(() => {
    if (keyboardHeight > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    } else {
      pendingScroll.current = true;
    }
  }, [keyboardHeight]);

  return { scrollRef, keyboardHeight, scrollToBottomField };
}

import { useEffect, useRef, useState, useCallback } from "react";
import { Keyboard, Platform, Dimensions } from "react-native";

const GAP = 16; // space kept between the field and the keyboard

/**
 * Keeps a focused text field in a full-height bottom sheet visible while
 * the keyboard is open, moving the content as little as possible.
 *
 * The sheets use keyboardBehavior="extend" so the sheet itself does not
 * move. The scroll content gets bottom padding equal to the keyboard (so
 * there is room to scroll), and when a field is focused it is scrolled up
 * only by the amount it would be hidden behind the keyboard. A field that is
 * already visible does not move at all.
 *
 * Usage: spread `scrollProps` on the BottomSheetScrollView, give the field a
 * ref, and call `revealField(ref)` from its onFocus.
 */
export default function useSheetKeyboard() {
  const scrollRef = useRef(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef(null);
  const pendingField = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollFieldAboveKeyboard = useCallback((fieldRef) => {
    const node = fieldRef?.current;
    const top = keyboardTop.current;
    if (!node || top == null || !node.measureInWindow) return;
    node.measureInWindow((x, y, w, h) => {
      const hiddenBy = y + h + GAP - top;
      if (hiddenBy > 0) {
        scrollRef.current?.scrollTo({
          y: scrollY.current + hiddenBy,
          animated: true,
        });
      }
    });
  }, []);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, (e) => {
      const height = e?.endCoordinates?.height || 0;
      keyboardTop.current =
        e?.endCoordinates?.screenY ?? Dimensions.get("window").height - height;
      setKeyboardHeight(height);
      if (pendingField.current) {
        const field = pendingField.current;
        pendingField.current = null;
        // Wait for the padding to be laid out, so there is room to scroll.
        setTimeout(() => scrollFieldAboveKeyboard(field), Platform.OS === "ios" ? 250 : 80);
      }
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      keyboardTop.current = null;
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollFieldAboveKeyboard]);

  /** Call from a field's onFocus with that field's ref. */
  const revealField = useCallback(
    (fieldRef) => {
      if (keyboardTop.current != null) {
        scrollFieldAboveKeyboard(fieldRef);
      } else {
        pendingField.current = fieldRef;
      }
    },
    [scrollFieldAboveKeyboard],
  );

  const scrollProps = {
    ref: scrollRef,
    onScroll: (e) => {
      scrollY.current = e?.nativeEvent?.contentOffset?.y || 0;
    },
    scrollEventThrottle: 16,
  };

  return { scrollRef, scrollProps, keyboardHeight, revealField };
}

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DISPLAY_DURATION_MS = 2000;
const FADE_DURATION_MS = 200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (text: string) => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      setMessage(text);
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start();

      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_DURATION_MS,
          useNativeDriver: true,
        }).start(() => setMessage(null));
      }, DISPLAY_DURATION_MS);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.container, { top: insets.top + 12, opacity }]}
        >
          <Animated.View style={styles.toast}>
            <Text style={styles.text}>{message}</Text>
          </Animated.View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast는 ToastProvider 안에서만 쓸 수 있어요.");
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  toast: {
    backgroundColor: "#000000cc",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: "80%",
  },
  text: {
    color: "#fff",
    fontSize: 14,
  },
});

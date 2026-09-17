import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Modal, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useToast } from "@/components/toast-provider";
import { useThemeColor } from "@/hooks/use-theme-color";
import { signOut } from "@/ports/auth";

const SIDE_MENU_WIDTH = Math.min(300, Dimensions.get("window").width * 0.8);
const ANIMATION_DURATION_MS = 250;
const BACKDROP_COLOR = "#00000055";

export function SideMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");
  const { showToast } = useToast();
  const translateX = useRef(new Animated.Value(SIDE_MENU_WIDTH)).current;
  const [isMounted, setIsMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.timing(translateX, {
        toValue: 0,
        duration: ANIMATION_DURATION_MS,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: SIDE_MENU_WIDTH,
        duration: ANIMATION_DURATION_MS,
        useNativeDriver: true,
      }).start(() => setIsMounted(false));
    }
  }, [visible, translateX]);

  function handlePressLogout() {
    onClose();
    signOut();
    showToast("로그아웃되었습니다");
  }

  if (!isMounted) {
    return null;
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.panel,
          { width: SIDE_MENU_WIDTH, backgroundColor, paddingTop: insets.top, transform: [{ translateX }] },
        ]}
      >
        <View style={styles.content} />
        <TouchableOpacity
          style={[styles.logoutRow, { paddingBottom: insets.bottom + 16 }]}
          onPress={handlePressLogout}
        >
          <ThemedText>로그아웃</ThemedText>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BACKDROP_COLOR,
  },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
  },
  content: {
    flex: 1,
  },
  logoutRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});

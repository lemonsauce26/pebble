import { useEffect, useRef, type ReactNode } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { IconSymbol } from "@/components/ui/icon-symbol";

const ACTION_WIDTH = 72;
const OPEN_THRESHOLD = 40;

/**
 * 행을 왼쪽으로 쓸면 오른쪽에서 삭제 버튼이 덮으며 나온다.
 * 행 내용은 제자리에 그대로 있고 버튼만 움직인다.
 */
export function SwipeToDeleteRow({
  children,
  isOpen,
  onRequestOpen,
  onRequestClose,
  onPressRow,
  onPressDelete,
}: {
  children: ReactNode;
  isOpen: boolean;
  onRequestOpen: () => void;
  onRequestClose: () => void;
  onPressRow: () => void;
  onPressDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(ACTION_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : ACTION_WIDTH,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isOpen, translateX]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onEnd((event) => {
      if (event.translationX < -OPEN_THRESHOLD) {
        onRequestOpen();
      } else if (event.translationX > OPEN_THRESHOLD) {
        onRequestClose();
      }
    })
    .runOnJS(true);

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.row} onPress={onPressRow}>
          {children}
        </TouchableOpacity>

        <Animated.View
          style={[styles.action, { transform: [{ translateX }] }]}
          pointerEvents={isOpen ? "auto" : "none"}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onPressDelete}
            accessibilityRole="button"
            accessibilityLabel="삭제"
          >
            <IconSymbol name="trash" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  row: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  action: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: ACTION_WIDTH,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#d33",
    alignItems: "center",
    justifyContent: "center",
  },
});

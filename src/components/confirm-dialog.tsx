import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export function ConfirmDialog({
  visible,
  message,
  confirmLabel = "확인",
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // 닫히는 애니메이션 동안에도 마지막 문구를 유지한다.
  // (닫으면서 원본 값이 비워지면 "undefined..."가 잠깐 보인다)
  const [shownMessage, setShownMessage] = useState(message);

  useEffect(() => {
    if (visible) {
      setShownMessage(message);
    }
  }, [visible, message]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.cardWrapper}>
          <ThemedView style={styles.card}>
            <ThemedText style={styles.message}>{shownMessage}</ThemedText>
            <ThemedView style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                <ThemedText>취소</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
                <ThemedText style={styles.confirmButtonText}>{confirmLabel}</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#00000055",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  cardWrapper: {
    width: "100%",
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    gap: 20,
  },
  message: {
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  button: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#ccc",
  },
  confirmButton: {
    backgroundColor: "#d33",
  },
  confirmButtonText: {
    color: "#fff",
  },
});

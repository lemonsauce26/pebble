import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

type ErrorDialogInput = {
  /** 무엇이 실패했는지. 예: "추가" → "추가에 실패했습니다." */
  action: string;
  code: string;
  message: string;
};

type ErrorDialogContextValue = {
  showErrorDialog: (input: ErrorDialogInput) => void;
};

const ErrorDialogContext = createContext<ErrorDialogContextValue | null>(null);

export function ErrorDialogProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<ErrorDialogInput | null>(null);

  const showErrorDialog = useCallback((input: ErrorDialogInput) => {
    setError(input);
  }, []);

  return (
    <ErrorDialogContext.Provider value={{ showErrorDialog }}>
      {children}
      <Modal
        visible={error !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setError(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setError(null)}>
          <Pressable style={styles.cardWrapper}>
            <ThemedView style={styles.card}>
              <ThemedText type="defaultSemiBold" style={styles.title}>
                {error?.action}에 실패했습니다.
              </ThemedText>
              <ThemedText style={styles.message}>
                [{error?.code}] {error?.message}
              </ThemedText>
              <ThemedView style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={() => setError(null)}>
                  <ThemedText style={styles.buttonText}>확인</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </ErrorDialogContext.Provider>
  );
}

export function useErrorDialog() {
  const context = useContext(ErrorDialogContext);
  if (!context) {
    throw new Error("useErrorDialog는 ErrorDialogProvider 안에서만 쓸 수 있어요.");
  }
  return context;
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
    gap: 16,
  },
  title: {
    fontSize: 16,
  },
  message: {
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    backgroundColor: "#208AEF",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  buttonText: {
    color: "#fff",
  },
});

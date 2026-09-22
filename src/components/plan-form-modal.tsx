import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, TextInput, TouchableOpacity } from "react-native";

import { MonthSelector } from "@/components/month-selector";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ERROR_CODES } from "@/constants/error-codes";
import { getCurrentMonthPeriod } from "@/domain/period";
import { createPlan } from "@/domain/plan";
import { systemClock } from "@/ports/clock";

/** DB 작업 결과. 실패하면 같은 모달 안에서 실패 안내로 바뀐다. */
export type PlanSubmitResult = { ok: true } | { ok: false; code: string; message: string };

export function PlanFormModal({
  visible,
  mode,
  initialTitle = "",
  initialPeriod,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  mode: "add" | "edit";
  initialTitle?: string;
  initialPeriod?: string;
  onClose: () => void;
  onSubmit: (input: { title: string; period: string }) => PlanSubmitResult;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [period, setPeriod] = useState(() => initialPeriod ?? getCurrentMonthPeriod(systemClock));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ code: string; message: string } | null>(null);

  // 모달이 열릴 때마다 지금 편집할 계획의 값으로 다시 채운다.
  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
      setPeriod(initialPeriod ?? getCurrentMonthPeriod(systemClock));
      setErrorMessage(null);
      setFailure(null);
    }
  }, [visible, initialTitle, initialPeriod]);

  const actionLabel = mode === "add" ? "추가" : "수정";

  function handleSubmit() {
    let validated;
    try {
      validated = createPlan(title);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류");
      return;
    }

    const result = onSubmit({ title: validated.title, period });
    if (result.ok) {
      return;
    }

    // 사용자가 바로 고칠 수 있는 문제(중복 이름)는 입력창 아래 안내로,
    // 예상 못한 실패만 모달 내용을 바꿔서 크게 알린다.
    if (result.code === ERROR_CODES.PLAN_DUPLICATE_TITLE) {
      setErrorMessage(result.message);
      return;
    }

    setFailure({ code: result.code, message: result.message });
  }

  // 실패 안내도 별도 모달이 아니라 같은 모달 안에서 내용만 바꾼다.
  // (모달 위에 모달을 띄우면 iOS에서 안 뜨거나 이후 모달까지 막히는 문제가 있다)
  if (failure) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setFailure(null)}>
        <Pressable style={styles.backdrop} onPress={() => setFailure(null)}>
          <Pressable style={styles.cardWrapper}>
            <ThemedView style={styles.dialogCard}>
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                {actionLabel}에 실패했습니다.
              </ThemedText>
              <ThemedText style={styles.dialogMessage}>
                [{failure.code}] {failure.message}
              </ThemedText>
              <ThemedView style={styles.dialogButtonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={() => setFailure(null)}
                >
                  <ThemedText style={styles.confirmButtonText}>확인</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.cardWrapper}>
          <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              {mode === "add" ? "계획 추가" : "계획 수정"}
            </ThemedText>

            <ThemedView style={styles.field}>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="이번 달엔 어떤 걸 이루고 싶으신가요?"
              />
              {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}
            </ThemedView>

            <MonthSelector period={period} onChange={setPeriod} rowStyle={styles.monthRow} />

            <ThemedView style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                <ThemedText>취소</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleSubmit}>
                <ThemedText style={styles.confirmButtonText}>{actionLabel}</ThemedText>
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
    padding: 28,
    gap: 24,
  },
  cardTitle: {
    fontSize: 16,
  },
  field: {
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  error: {
    color: "#d33",
    fontSize: 13,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  dialogCard: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    gap: 20,
  },
  dialogMessage: {
    lineHeight: 22,
  },
  dialogButtonRow: {
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
    backgroundColor: "#208AEF",
  },
  confirmButtonText: {
    color: "#fff",
  },
});

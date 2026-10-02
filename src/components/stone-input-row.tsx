import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { createStone, type NewStone, type StoneKind } from "@/domain/stone";
import { useThemeColor } from "@/hooks/use-theme-color";

const KIND_OPTIONS: { kind: StoneKind; label: string }[] = [
  { kind: "weekly", label: "이번 주에 한 번" },
  { kind: "daily", label: "매일" },
  { kind: "weekly_n", label: "주 N회" },
];

/**
 * 조약돌을 쏟아내기 위한 입력줄. 엔터를 치면 확정되고 입력창이 비워져서 바로 다음 것을 받는다.
 * 모달이 아니라 목록 안에 그대로 사는 컴포넌트다 — 모달 위에 모달을 띄우는 문제를 피한다.
 */
export function StoneInputRow({ onSubmit }: { onSubmit: (input: NewStone) => boolean }) {
  const iconColor = useThemeColor({}, "text");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<StoneKind>("weekly");
  const [targetText, setTargetText] = useState("");
  const [isKindOpen, setIsKindOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit() {
    let validated: NewStone;
    try {
      validated = createStone({
        title,
        kind,
        weeklyNTarget: kind === "weekly_n" ? Number(targetText) : null,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류");
      return;
    }

    // 저장이 실패하면 화면이 모달로 알린다. 입력값은 그대로 두어 다시 시도할 수 있게 한다.
    if (!onSubmit(validated)) {
      return;
    }

    setTitle("");
    setKind("weekly");
    setTargetText("");
    setIsKindOpen(false);
    setErrorMessage(null);
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.inputRow}>
        <ThemedView style={styles.inputBox}>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="이번 주에 할 작은 일 하나"
            autoFocus
            submitBehavior="submit"
            onSubmitEditing={handleSubmit}
          />
        </ThemedView>
        <TouchableOpacity
          style={styles.kindButton}
          onPress={() => setIsKindOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityLabel="조약돌 종류 바꾸기"
        >
          <IconSymbol
            name={isKindOpen ? "chevron.up" : "chevron.down"}
            size={18}
            color={iconColor}
            style={styles.kindButtonIcon}
          />
        </TouchableOpacity>
      </ThemedView>

      {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

      {isKindOpen ? (
        <ThemedView style={styles.kindOptions}>
          {KIND_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.kind}
              style={[styles.kindOption, kind === option.kind ? styles.kindOptionSelected : null]}
              onPress={() => setKind(option.kind)}
            >
              <ThemedText
                style={[
                  styles.kindOptionText,
                  kind === option.kind ? styles.kindOptionTextSelected : null,
                ]}
              >
                {option.label}
              </ThemedText>
            </TouchableOpacity>
          ))}

          {kind === "weekly_n" ? (
            <ThemedView style={styles.targetRow}>
              <TextInput
                style={styles.targetInput}
                value={targetText}
                onChangeText={setTargetText}
                keyboardType="number-pad"
                placeholder="3"
                maxLength={2}
              />
              <ThemedText style={styles.targetLabel}>번</ThemedText>
            </ThemedView>
          ) : null}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    gap: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  inputBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#208AEF",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: {
    paddingVertical: 12,
    fontSize: 15,
  },
  kindButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  kindButtonIcon: {
    opacity: 0.6,
  },
  error: {
    color: "#d33",
    fontSize: 13,
  },
  kindOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  kindOption: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  kindOptionSelected: {
    backgroundColor: "#208AEF",
    borderColor: "#208AEF",
  },
  kindOptionText: {
    fontSize: 13,
  },
  kindOptionTextSelected: {
    color: "#fff",
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  targetLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  targetInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 44,
    textAlign: "center",
    fontSize: 14,
  },
});

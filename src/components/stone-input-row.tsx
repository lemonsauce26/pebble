import { useRef, useState } from "react";
import {
  InputAccessoryView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { createStone, type NewStone, type StoneKind } from "@/domain/stone";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";

/**
 * 완료 바는 입력칸마다 따로 둔다. iOS에서 뷰 하나는 한 곳에만 붙을 수 있어서,
 * 두 입력칸이 같은 바를 가리키면 둘 중 하나에는 안 붙는다.
 */
const ACCESSORY_IDS = { title: "stone-title-accessory", target: "stone-target-accessory" };

/** iOS 키보드 배경색. 완료 바가 키보드에 붙어 있는 것처럼 보이게 맞춘다. */
const KEYBOARD_BACKGROUND = { light: "#E8E8ED", dark: "#2C2C2E" };

const KIND_OPTIONS: { kind: StoneKind; label: string }[] = [
  { kind: "weekly", label: "이번 주에 한 번" },
  { kind: "daily", label: "매일" },
  { kind: "weekly_n", label: "주 N회" },
];

/**
 * 조약돌을 쏟아내기 위한 입력줄. 엔터를 치면 확정되고 입력창이 비워져서 바로 다음 것을 받는다.
 * 모달이 아니라 목록 안에 그대로 사는 컴포넌트다 — 모달 위에 모달을 띄우는 문제를 피한다.
 *
 * `initial`을 주면 고치기 모드가 된다. 이때는 담은 뒤 비우지 않는다 (화면이 닫는다).
 */
export function StoneInputRow({
  initial,
  onSubmit,
}: {
  initial?: NewStone;
  onSubmit: (input: NewStone) => boolean;
}) {
  const iconColor = useThemeColor({}, "text");
  const colorScheme = useColorScheme();
  const titleInputRef = useRef<TextInput>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [kind, setKind] = useState<StoneKind>(initial?.kind ?? "weekly");
  const [targetText, setTargetText] = useState(
    initial?.weeklyNTarget != null ? String(initial.weeklyNTarget) : "",
  );
  // 입력줄만 봐서는 종류를 알 수 없으므로, 기본값이 아닌 조약돌을 고칠 때는 펼쳐서 보여준다.
  const [isKindOpen, setIsKindOpen] = useState(initial != null && initial.kind !== "weekly");
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

    if (initial) {
      return;
    }

    setTitle("");
    setKind("weekly");
    setTargetText("");
    setIsKindOpen(false);
    setErrorMessage(null);

    // 횟수 칸에서 담으면 그 칸이 사라지며 키보드까지 닫힌다. 이름 칸으로 넘겨 흐름을 잇는다.
    titleInputRef.current?.focus();
  }

  function renderDoneBar(nativeID: string) {
    return (
      <InputAccessoryView nativeID={nativeID}>
        <View
          style={[
            styles.accessoryBar,
            { backgroundColor: KEYBOARD_BACKGROUND[colorScheme ?? "light"] },
          ]}
        >
          <TouchableOpacity
            style={styles.accessoryButton}
            onPress={handleSubmit}
            accessibilityRole="button"
          >
            <ThemedText style={styles.accessoryText}>완료</ThemedText>
          </TouchableOpacity>
        </View>
      </InputAccessoryView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.inputRow}>
        <ThemedView style={styles.inputBox}>
          <TextInput
            ref={titleInputRef}
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="이번 주에 할 작은 일 하나"
            autoFocus
            submitBehavior="submit"
            onSubmitEditing={handleSubmit}
            inputAccessoryViewID={Platform.OS === "ios" ? ACCESSORY_IDS.title : undefined}
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
                // 숫자 키보드에는 리턴 키가 없어서 완료 바가 유일한 확정 수단이다.
                inputAccessoryViewID={Platform.OS === "ios" ? ACCESSORY_IDS.target : undefined}
                submitBehavior="submit"
                onSubmitEditing={handleSubmit}
              />
              <ThemedText style={styles.targetLabel}>번</ThemedText>
            </ThemedView>
          ) : null}
        </ThemedView>
      ) : null}

      {Platform.OS === "ios" ? renderDoneBar(ACCESSORY_IDS.title) : null}
      {Platform.OS === "ios" && kind === "weekly_n" ? renderDoneBar(ACCESSORY_IDS.target) : null}
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
  accessoryBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 12,
  },
  accessoryButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  accessoryText: {
    color: "#208AEF",
    fontSize: 16,
    fontWeight: "600",
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

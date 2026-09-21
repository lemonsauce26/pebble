import { useState } from "react";
import { Modal, Pressable, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  formatPeriodLabel,
  getCurrentMonthPeriod,
  parseMonthPeriod,
  shiftMonthPeriod,
  toMonthPeriod,
} from "@/domain/period";
import { createPlan } from "@/domain/plan";
import { useThemeColor } from "@/hooks/use-theme-color";
import { systemClock } from "@/ports/clock";

const YEAR_RANGE = 5;

function buildYearOptions(currentYear: number): number[] {
  const years: number[] = [];
  for (let year = currentYear - YEAR_RANGE; year <= currentYear + YEAR_RANGE; year += 1) {
    years.push(year);
  }
  return years;
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export function AddPlanModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: { title: string; period: string }) => void;
}) {
  const iconColor = useThemeColor({}, "text");
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState(() => getCurrentMonthPeriod(systemClock));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const { year: selectedYear, month: selectedMonth } = parseMonthPeriod(period);
  const yearOptions = buildYearOptions(parseMonthPeriod(getCurrentMonthPeriod(systemClock)).year);

  function handleClose() {
    setTitle("");
    setPeriod(getCurrentMonthPeriod(systemClock));
    setErrorMessage(null);
    setIsPickerOpen(false);
    onClose();
  }

  function handleSubmit() {
    try {
      const validated = createPlan(title);
      onSubmit({ title: validated.title, period });
      handleClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류");
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.cardWrapper}>
          <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              계획 추가
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

            <ThemedView style={styles.field}>
              <ThemedView style={styles.monthRow}>
                <TouchableOpacity
                  onPress={() => setPeriod(shiftMonthPeriod(period, -1))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="이전 달"
                >
                  <IconSymbol name="chevron.left" size={20} color={iconColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsPickerOpen((open) => !open)}
                  accessibilityRole="button"
                  accessibilityLabel="년월 선택"
                >
                  <ThemedText>{formatPeriodLabel("month", period)}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPeriod(shiftMonthPeriod(period, 1))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="다음 달"
                >
                  <IconSymbol name="chevron.right" size={20} color={iconColor} />
                </TouchableOpacity>
              </ThemedView>

              {isPickerOpen ? (
                <ThemedView style={styles.pickerRow}>
                  <Picker
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                    selectedValue={selectedYear}
                    onValueChange={(year) => setPeriod(toMonthPeriod(Number(year), selectedMonth))}
                  >
                    {yearOptions.map((year) => (
                      <Picker.Item key={year} label={`${year}년`} value={year} color={iconColor} />
                    ))}
                  </Picker>
                  <Picker
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                    selectedValue={selectedMonth}
                    onValueChange={(month) => setPeriod(toMonthPeriod(selectedYear, Number(month)))}
                  >
                    {MONTH_OPTIONS.map((month) => (
                      <Picker.Item
                        key={month}
                        label={`${month}월`}
                        value={month}
                        color={iconColor}
                      />
                    ))}
                  </Picker>
                </ThemedView>
              ) : null}
            </ThemedView>

            <ThemedView style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose}>
                <ThemedText>취소</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleSubmit}>
                <ThemedText style={styles.confirmButtonText}>추가</ThemedText>
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
  pickerRow: {
    flexDirection: "row",
  },
  picker: {
    flex: 1,
  },
  pickerItem: {
    fontSize: 20,
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

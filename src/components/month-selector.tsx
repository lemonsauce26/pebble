import { useState } from "react";
import { Pressable, StyleSheet, TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";
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
import { useThemeColor } from "@/hooks/use-theme-color";
import { systemClock } from "@/ports/clock";

const YEAR_RANGE = 5;
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

function buildYearOptions(currentYear: number): number[] {
  const years: number[] = [];
  for (let year = currentYear - YEAR_RANGE; year <= currentYear + YEAR_RANGE; year += 1) {
    years.push(year);
  }
  return years;
}

/**
 * 꺾쇠는 한 달씩 바로 이동한다.
 * 가운데 년월을 누르면 화면 위에 레이어로 롤링 선택창이 뜨는데,
 * 여기서는 굴리는 동안 조회를 매번 다시 하지 않도록 "이동" 버튼을 눌러야 실제로 반영된다.
 * (모달 안에서도 쓰이므로 RN Modal이 아니라 절대 위치 레이어로 구현 — 모달 안에 모달을 띄우면 안 됨)
 */
export function MonthSelector({
  period,
  onChange,
  labelType = "default",
  rowStyle,
}: {
  period: string;
  onChange: (period: string) => void;
  labelType?: "default" | "title";
  rowStyle?: StyleProp<ViewStyle>;
}) {
  const iconColor = useThemeColor({}, "text");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pendingPeriod, setPendingPeriod] = useState(period);

  const { year: pendingYear, month: pendingMonth } = parseMonthPeriod(pendingPeriod);
  const yearOptions = buildYearOptions(parseMonthPeriod(getCurrentMonthPeriod(systemClock)).year);

  function openPicker() {
    setPendingPeriod(period);
    setIsPickerOpen(true);
  }

  function handleMove() {
    onChange(pendingPeriod);
    setIsPickerOpen(false);
  }

  return (
    <ThemedView style={styles.anchor}>
      <ThemedView style={[styles.row, rowStyle]}>
        <TouchableOpacity
          onPress={() => onChange(shiftMonthPeriod(period, -1))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="이전 달"
        >
          <IconSymbol name="chevron.left" size={20} color={iconColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={openPicker} accessibilityRole="button" accessibilityLabel="년월 선택">
          <ThemedText type={labelType}>{formatPeriodLabel("month", period)}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onChange(shiftMonthPeriod(period, 1))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="다음 달"
        >
          <IconSymbol name="chevron.right" size={20} color={iconColor} />
        </TouchableOpacity>
      </ThemedView>

      {isPickerOpen ? (
        <>
          <Pressable style={styles.backdrop} onPress={() => setIsPickerOpen(false)} />
          <ThemedView style={styles.layer}>
            <ThemedView style={styles.pickerRow}>
              <Picker
                style={styles.picker}
                itemStyle={styles.pickerItem}
                selectedValue={pendingYear}
                onValueChange={(year) => setPendingPeriod(toMonthPeriod(Number(year), pendingMonth))}
              >
                {yearOptions.map((year) => (
                  <Picker.Item key={year} label={`${year}년`} value={year} color={iconColor} />
                ))}
              </Picker>
              <Picker
                style={styles.picker}
                itemStyle={styles.pickerItem}
                selectedValue={pendingMonth}
                onValueChange={(month) => setPendingPeriod(toMonthPeriod(pendingYear, Number(month)))}
              >
                {MONTH_OPTIONS.map((month) => (
                  <Picker.Item key={month} label={`${month}월`} value={month} color={iconColor} />
                ))}
              </Picker>
            </ThemedView>
            <ThemedView style={styles.moveButtonRow}>
              <TouchableOpacity onPress={handleMove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <ThemedText style={styles.moveButtonText}>확인</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "relative",
    zIndex: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: -1000,
    right: -1000,
    bottom: -1000,
  },
  layer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
  moveButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  moveButtonText: {
    color: "#208AEF",
    fontWeight: "600",
  },
});

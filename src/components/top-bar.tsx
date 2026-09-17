import { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SideMenu } from "@/components/side-menu";
import { useThemeColor } from "@/hooks/use-theme-color";

const BAR_HEIGHT = 48;
const ICON_SIZE = 24;

export function TopBar() {
  const insets = useSafeAreaInsets();
  const iconColor = useThemeColor({}, "text");
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedView style={styles.row}>
        <ThemedView style={styles.sideSlot}>
          {canGoBack ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="뒤로 가기"
            >
              <IconSymbol name="chevron.left" size={ICON_SIZE} color={iconColor} />
            </TouchableOpacity>
          ) : null}
        </ThemedView>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          조약돌
        </ThemedText>
        <ThemedView style={styles.sideSlot}>
          <TouchableOpacity
            onPress={() => setIsSideMenuOpen(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="메뉴 열기"
          >
            <IconSymbol name="line.3.horizontal" size={ICON_SIZE} color={iconColor} />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <SideMenu visible={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#00000022",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: BAR_HEIGHT,
  },
  sideSlot: {
    width: ICON_SIZE,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
  },
});

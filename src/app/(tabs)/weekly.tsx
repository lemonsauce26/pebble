import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import { useErrorDialog } from "@/components/error-dialog-provider";
import { StoneInputRow } from "@/components/stone-input-row";
import { StoneRow } from "@/components/stone-row";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ERROR_CODES } from "@/constants/error-codes";
import { db } from "@/data/db";
import migrations from "@/data/migrations/migrations";
import { selectPlans } from "@/data/plan.repository";
import { findPocketContaining, getOrCreatePocket } from "@/data/pocket.repository";
import { stone as stoneTable } from "@/data/schema";
import { insertStone, selectStones } from "@/data/stone.repository";
import { toMonthPeriod } from "@/domain/period";
import type { NewStone } from "@/domain/stone";
import { formatWeekLabel, getCurrentWeekRange } from "@/domain/week";
import { systemClock } from "@/ports/clock";
import { supabase } from "@/ports/supabase";

type StoneData = typeof stoneTable.$inferSelect;

/** 계획에 묶이지 않은 조약돌들이 모이는 섹션의 키. */
const LOOSE_SECTION_KEY = "__loose__";

/** 입력 중인 섹션과 키보드 사이에 남길 여백. */
const SECTION_BOTTOM_GAP = 32;

export default function WeeklyScreen() {
  const { success: migrationsReady, error: migrationError } = useMigrations(db, migrations);
  const { showErrorDialog } = useErrorDialog();
  const [userId, setUserId] = useState<string | null>(null);
  const [pocketId, setPocketId] = useState<string | null>(null);
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);
  const [weekRange] = useState(() => getCurrentWeekRange(systemClock));
  const scrollRef = useRef<ScrollView>(null);
  const sectionLayouts = useRef<Record<string, { y: number; height: number }>>({});
  const viewportHeight = useRef(0);
  const keyboardHeight = useRef(0);
  const scrollOffset = useRef(0);

  // 주가 두 달에 걸치면 시작일이 속한 달의 계획을 보여준다.
  const period = toMonthPeriod(
    Number(weekRange.startDate.slice(0, 4)),
    Number(weekRange.startDate.slice(5, 7)),
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", (event) => {
      keyboardHeight.current = event.endCoordinates.height;
    });
    const hidden = Keyboard.addListener("keyboardDidHide", () => {
      keyboardHeight.current = 0;
    });
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  // 주머니 행은 첫 조약돌을 담을 때 만들어진다. 그전에는 없는 게 정상이다.
  useEffect(() => {
    if (!migrationsReady || !userId) {
      return;
    }
    setPocketId(findPocketContaining(db, userId, weekRange.startDate)?.id ?? null);
  }, [migrationsReady, userId, weekRange.startDate]);

  const { data: plans } = useLiveQuery(selectPlans(db, userId ?? "", "month", period), [
    userId,
    period,
  ]);
  const { data: stones } = useLiveQuery(selectStones(db, pocketId ?? ""), [pocketId]);

  // 계획이 지워진 조약돌도 "계획과 상관없이"로 내려와서, 어떤 조약돌도 화면에서 사라지지 않는다.
  const { stonesByPlan, looseStones, emptyPlanCount } = useMemo(() => {
    const planIds = new Set((plans ?? []).map((item) => item.id));
    const byPlan = new Map<string, StoneData[]>();
    const loose: StoneData[] = [];

    for (const item of stones ?? []) {
      if (item.planId !== null && planIds.has(item.planId)) {
        byPlan.set(item.planId, [...(byPlan.get(item.planId) ?? []), item]);
      } else {
        loose.push(item);
      }
    }

    return {
      stonesByPlan: byPlan,
      looseStones: loose,
      emptyPlanCount: (plans ?? []).filter((item) => !byPlan.has(item.id)).length,
    };
  }, [plans, stones]);

  if (migrationError) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>DB 준비 중 문제가 생겼어요: {migrationError.message}</ThemedText>
      </ThemedView>
    );
  }

  if (!migrationsReady || !userId) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>준비 중...</ThemedText>
      </ThemedView>
    );
  }

  function handleAddStone(planId: string | null, input: NewStone): boolean {
    if (!userId) {
      return false;
    }

    try {
      const pocket = getOrCreatePocket(db, userId, weekRange, systemClock);
      insertStone(
        db,
        {
          userId,
          pocketId: pocket.id,
          planId,
          title: input.title,
          kind: input.kind,
          weeklyNTarget: input.weeklyNTarget,
        },
        systemClock,
      );
      setPocketId(pocket.id);
      return true;
    } catch (error) {
      showErrorDialog({
        action: "추가",
        code: ERROR_CODES.STONE_INSERT_FAILED,
        message: error instanceof Error ? error.message : "조약돌을 담지 못했습니다.",
      });
      return false;
    }
  }

  /**
   * iOS는 글자 입력칸만 보이게 스크롤해줘서 그 아래 종류 패널이 키보드에 가린다.
   * 섹션의 아랫변이 키보드 바로 위에 오도록 필요한 만큼만 올린다. 이미 다 보이면 움직이지 않는다.
   */
  function scrollSectionIntoView(sectionKey: string) {
    const layout = sectionLayouts.current[sectionKey];
    if (!layout) {
      return;
    }

    const visibleHeight = viewportHeight.current - keyboardHeight.current;
    const targetY = layout.y + layout.height + SECTION_BOTTOM_GAP - visibleHeight;

    if (targetY > scrollOffset.current) {
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    }
  }

  function openSection(sectionKey: string) {
    setActiveSectionKey(sectionKey);
    // 키보드가 올라와야 스크롤 여유가 생기므로 한 박자 기다린다.
    setTimeout(() => scrollSectionIntoView(sectionKey), 250);
  }

  function renderSection(
    sectionKey: string,
    heading: string,
    sectionStones: StoneData[],
    planId: string | null,
  ) {
    const isEmpty = sectionStones.length === 0;

    return (
      <ThemedView
        key={sectionKey}
        style={styles.section}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          const previous = sectionLayouts.current[sectionKey];
          sectionLayouts.current[sectionKey] = { y, height };

          // 종류 패널을 펼치면 섹션이 길어진다. 그때도 가려지지 않게 다시 맞춘다.
          if (sectionKey === activeSectionKey && previous?.height !== height) {
            scrollSectionIntoView(sectionKey);
          }
        }}
      >
        <ThemedText type="defaultSemiBold">{heading}</ThemedText>

        {sectionStones.map((item) => (
          <StoneRow
            key={item.id}
            title={item.title}
            kind={item.kind}
            weeklyNTarget={item.weeklyNTarget}
          />
        ))}

        {activeSectionKey === sectionKey ? (
          <StoneInputRow onSubmit={(input) => handleAddStone(planId, input)} />
        ) : (
          <TouchableOpacity
            style={[styles.addButton, isEmpty ? styles.addButtonEmpty : null]}
            onPress={() => openSection(sectionKey)}
            accessibilityRole="button"
          >
            <ThemedText style={styles.addButtonText}>+ 조약돌 추가</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      {/* 화면을 줄이는 대신 키보드 높이만큼 스크롤 여백만 잡는다. 화면이 줄면 키보드 위에 빈 띠가 생긴다. */}
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        scrollEventThrottle={16}
        onLayout={(event) => {
          viewportHeight.current = event.nativeEvent.layout.height;
        }}
        onScroll={(event) => {
          scrollOffset.current = event.nativeEvent.contentOffset.y;
        }}
        onScrollBeginDrag={() => setActiveSectionKey(null)}
      >
        <Pressable style={styles.flex} onPress={() => setActiveSectionKey(null)}>
          <ThemedText type="title">{formatWeekLabel(weekRange)}</ThemedText>

          {plans && plans.length > 0 && emptyPlanCount > 0 ? (
            <ThemedText style={styles.summary}>
              계획 {plans.length}개 중 {emptyPlanCount}개는 아직 비어 있어요
            </ThemedText>
          ) : null}

          {plans && plans.length === 0 ? (
            <ThemedText style={styles.summary}>
              이번 달 계획이 없어요. 먼슬리 주머니에서 먼저 계획을 세워보세요.
            </ThemedText>
          ) : null}

          {(plans ?? []).map((item) =>
            renderSection(item.id, item.title, stonesByPlan.get(item.id) ?? [], item.id),
          )}

          {renderSection(LOOSE_SECTION_KEY, "이번 달 계획과 상관없이", looseStones, null)}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    // 마지막 섹션도 다른 섹션과 같은 높이까지 올라가려면 그만큼 스크롤할 여백이 아래에 있어야 한다.
    paddingBottom: SECTION_BOTTOM_GAP,
    gap: 12,
  },
  summary: {
    opacity: 0.6,
    fontSize: 13,
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    gap: 2,
  },
  addButton: {
    paddingVertical: 10,
  },
  addButtonEmpty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ccc",
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  addButtonText: {
    color: "#208AEF",
    fontSize: 14,
  },
});

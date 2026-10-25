import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import { useErrorDialog } from "@/components/error-dialog-provider";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { DRAW_COUNT } from "@/constants/draw";
import { ERROR_CODES } from "@/constants/error-codes";
import {
  cancelRest,
  confirmDraw,
  createDraw,
  findDrawByDate,
  findDrawStoneRows,
  rerollDraw,
  restDraw,
  selectDrawnStones,
} from "@/data/daily-draw.repository";
import { db } from "@/data/db";
import migrations from "@/data/migrations/migrations";
import { findPocketContaining, getOrCreatePocket } from "@/data/pocket.repository";
import { dailyDraw } from "@/data/schema";
import { selectStones } from "@/data/stone.repository";
import { formatTodayLabel, getTodayKey } from "@/domain/day";
import { drawStones, remainingRerolls, selectDrawCandidates } from "@/domain/draw";
import { getCurrentWeekRange } from "@/domain/week";
import { systemClock } from "@/ports/clock";
import { supabaseDailyDrawRemote } from "@/ports/daily-draw-remote";
import { systemRandom } from "@/ports/random";
import { supabase } from "@/ports/supabase";
import { pushDailyDraw } from "@/sync/daily-draw-push";

type DrawRow = typeof dailyDraw.$inferSelect;

export default function TodayScreen() {
  const { success: migrationsReady, error: migrationError } = useMigrations(db, migrations);
  const { showErrorDialog } = useErrorDialog();
  const [userId, setUserId] = useState<string | null>(null);
  const [pocketId, setPocketId] = useState<string | null>(null);
  const [draw, setDraw] = useState<DrawRow | null>(null);
  const [todayKey] = useState(() => getTodayKey(systemClock));
  const [weekRange] = useState(() => getCurrentWeekRange(systemClock));

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!migrationsReady || !userId) {
      return;
    }
    setPocketId(findPocketContaining(db, userId, weekRange.startDate)?.id ?? null);
    setDraw(findDrawByDate(db, userId, todayKey) ?? null);
  }, [migrationsReady, userId, weekRange.startDate, todayKey]);

  const { data: stones } = useLiveQuery(selectStones(db, pocketId ?? ""), [pocketId]);
  const { data: drawnStones } = useLiveQuery(selectDrawnStones(db, draw?.id ?? ""), [draw?.id]);

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

  const candidates = selectDrawCandidates(stones ?? []);

  function pickStoneIds() {
    return drawStones(candidates, DRAW_COUNT, systemRandom).map((item) => item.id);
  }

  /** 뽑기는 바뀔 때마다 통째로 다시 올린다. 기록이 하루에 하나뿐이라 그게 가장 단순하다. */
  function applyDraw(updated: DrawRow) {
    setDraw(updated);

    if (!userId) {
      return;
    }

    // 주머니까지 한 덩어리로 올린다. 연동 전에 만든 주머니는 클라우드에 없다.
    const pocket = getOrCreatePocket(db, userId, weekRange, systemClock);

    pushDailyDraw(supabaseDailyDrawRemote, pocket, updated, findDrawStoneRows(db, updated.id)).catch(
      (error) => {
        showErrorDialog({
          action: "클라우드 저장",
          code: ERROR_CODES.DRAW_CLOUD_PUSH_FAILED,
          message:
            error instanceof Error
              ? error.message
              : "인터넷 연결을 확인해주세요. 이 기기에는 저장되어 있습니다.",
        });
      },
    );
  }

  function handleDraw() {
    if (!userId || !pocketId) {
      return;
    }

    try {
      applyDraw(
        createDraw(
          db,
          { userId, drawDate: todayKey, pocketId, stoneIds: pickStoneIds() },
          systemClock,
        ),
      );
    } catch (error) {
      showErrorDialog({
        action: "뽑기",
        code: ERROR_CODES.DRAW_FAILED,
        message: error instanceof Error ? error.message : "조약돌을 뽑지 못했습니다.",
      });
    }
  }

  function handleReroll() {
    if (!draw) {
      return;
    }

    try {
      applyDraw(rerollDraw(db, draw.id, pickStoneIds(), systemClock));
    } catch (error) {
      showErrorDialog({
        action: "다시 뽑기",
        code: ERROR_CODES.REROLL_FAILED,
        message: error instanceof Error ? error.message : "다시 뽑지 못했습니다.",
      });
    }
  }

  function handleRest() {
    if (!draw) {
      return;
    }

    try {
      applyDraw(restDraw(db, draw.id, systemClock));
    } catch (error) {
      showErrorDialog({
        action: "쉬기",
        code: ERROR_CODES.REST_FAILED,
        message: error instanceof Error ? error.message : "오늘을 쉼으로 두지 못했습니다.",
      });
    }
  }

  function handleCancelRest() {
    if (!draw) {
      return;
    }

    try {
      applyDraw(cancelRest(db, draw.id, systemClock));
    } catch (error) {
      showErrorDialog({
        action: "되돌리기",
        code: ERROR_CODES.CANCEL_REST_FAILED,
        message: error instanceof Error ? error.message : "되돌리지 못했습니다.",
      });
    }
  }

  function handleConfirm() {
    if (!draw) {
      return;
    }

    try {
      applyDraw(confirmDraw(db, draw.id, systemClock));
    } catch (error) {
      showErrorDialog({
        action: "확정",
        code: ERROR_CODES.CONFIRM_DRAW_FAILED,
        message: error instanceof Error ? error.message : "오늘의 조약돌을 정하지 못했습니다.",
      });
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{formatTodayLabel(todayKey)}</ThemedText>

      {draw !== null && draw.restedAt !== null ? (
        <ThemedView style={styles.centered}>
          <ThemedText style={styles.restTitle}>오늘은 쉬어가요</ThemedText>
          <ThemedText style={styles.restMessage}>충전도 하루의 일이에요.</ThemedText>
          <TouchableOpacity onPress={handleCancelRest} accessibilityRole="button">
            <ThemedText style={styles.linkText}>역시 해볼까요?</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : draw !== null ? (
        <>
          <ThemedView style={styles.cards}>
            {(drawnStones ?? []).map((row) => (
              <ThemedView key={row.stone.id} style={styles.card}>
                <ThemedText style={styles.cardTitle}>{row.stone.title}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>

          {draw.confirmedAt === null ? (
            <ThemedView style={styles.actions}>
              {remainingRerolls(draw.rerollCount) > 0 ? (
                <TouchableOpacity onPress={handleReroll} accessibilityRole="button">
                  <ThemedText style={styles.rerollText}>
                    다시 뽑기 ({remainingRerolls(draw.rerollCount)}번 남음)
                  </ThemedText>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
                accessibilityRole="button"
              >
                <ThemedText style={styles.confirmButtonText}>이걸로 할게요</ThemedText>
              </TouchableOpacity>

              {/* 뽑기 전에 두면 뽑는 것보다 누르기 쉬워서 회피 경로가 된다 (기획서 8장). */}
              <TouchableOpacity onPress={handleRest} accessibilityRole="button">
                <ThemedText style={styles.restLinkText}>오늘은 쉴게요</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : null}
        </>
      ) : candidates.length === 0 ? (
        <ThemedView style={styles.centered}>
          <ThemedText style={styles.guide}>
            위클리 주머니에 조약돌을 먼저 담아주세요
          </ThemedText>
        </ThemedView>
      ) : (
        <ThemedView style={styles.centered}>
          <ThemedText style={styles.question}>오늘의 조약돌을 뽑아볼까요?</ThemedText>
          <TouchableOpacity style={styles.drawButton} onPress={handleDraw} accessibilityRole="button">
            <ThemedText style={styles.drawButtonText}>뽑기</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    padding: 16,
  },
  question: {
    fontSize: 17,
  },
  guide: {
    opacity: 0.6,
    textAlign: "center",
  },
  drawButton: {
    backgroundColor: "#208AEF",
    borderRadius: 999,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  drawButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cards: {
    flex: 1,
    gap: 12,
    marginTop: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  cardTitle: {
    fontSize: 17,
  },
  actions: {
    alignItems: "center",
    gap: 16,
    paddingBottom: 8,
  },
  restTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  restMessage: {
    opacity: 0.6,
    marginTop: -12,
  },
  restLinkText: {
    opacity: 0.5,
    fontSize: 14,
    paddingVertical: 4,
  },
  linkText: {
    color: "#208AEF",
    fontSize: 15,
    paddingVertical: 4,
  },
  rerollText: {
    color: "#208AEF",
    fontSize: 15,
    paddingVertical: 4,
  },
  confirmButton: {
    backgroundColor: "#208AEF",
    borderRadius: 999,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

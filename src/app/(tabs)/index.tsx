import { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import { PlanFormModal, type PlanSubmitResult } from "@/components/plan-form-modal";
import { EmptyState } from "@/components/empty-state";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useErrorDialog } from "@/components/error-dialog-provider";
import { ERROR_CODES } from "@/constants/error-codes";
import { db } from "@/data/db";
import migrations from "@/data/migrations/migrations";
import {
  DuplicatePlanTitleError,
  insertPlan,
  selectPlans,
  updatePlan,
} from "@/data/plan.repository";
import { formatPeriodLabel, getCurrentMonthPeriod } from "@/domain/period";
import { systemClock } from "@/ports/clock";
import { supabasePlanRemote } from "@/ports/plan-remote";
import { supabase } from "@/ports/supabase";
import { pushPlan } from "@/sync/plan-push";

type EditingPlan = { id: string; title: string; period: string };

export default function HomeScreen() {
  const { success: migrationsReady, error: migrationError } = useMigrations(db, migrations);
  const { showErrorDialog } = useErrorDialog();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<EditingPlan | null>(null);

  const period = getCurrentMonthPeriod(systemClock);
  const monthLabel = formatPeriodLabel("month", period);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: plans } = useLiveQuery(selectPlans(db, userId ?? "", "month", period), [
    userId,
    period,
  ]);

  if (migrationError) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>DB 준비 중 문제가 생겼어요: {migrationError.message}</ThemedText>
      </ThemedView>
    );
  }

  if (!migrationsReady || !userId) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>준비 중...</ThemedText>
      </ThemedView>
    );
  }

  function pushToCloud(promise: Promise<void>, action: string, code: string, fallback: string) {
    promise.catch((error) => {
      showErrorDialog({
        action,
        code,
        message: error instanceof Error ? error.message : fallback,
      });
    });
  }

  function handleAddPlan(input: { title: string; period: string }): PlanSubmitResult {
    if (!userId) {
      return { ok: false, code: ERROR_CODES.UNKNOWN, message: "로그인 정보를 확인하지 못했습니다." };
    }

    let saved;
    try {
      saved = insertPlan(
        db,
        { userId, type: "month", period: input.period, title: input.title },
        systemClock,
      );
    } catch (error) {
      return {
        ok: false,
        code:
          error instanceof DuplicatePlanTitleError
            ? ERROR_CODES.PLAN_DUPLICATE_TITLE
            : ERROR_CODES.PLAN_INSERT_FAILED,
        message: error instanceof Error ? error.message : "계획을 저장하지 못했습니다.",
      };
    }

    setIsAddModalOpen(false);
    pushToCloud(
      pushPlan(supabasePlanRemote, saved),
      "클라우드 저장",
      ERROR_CODES.PLAN_CLOUD_PUSH_FAILED,
      "인터넷 연결을 확인해주세요. 이 기기에는 저장되어 있습니다.",
    );

    return { ok: true };
  }

  function handleUpdatePlan(input: { title: string; period: string }): PlanSubmitResult {
    if (!userId || !editingPlan) {
      return { ok: false, code: ERROR_CODES.UNKNOWN, message: "수정할 계획을 찾지 못했습니다." };
    }

    let updated;
    try {
      updated = updatePlan(
        db,
        { id: editingPlan.id, userId, type: "month", period: input.period, title: input.title },
        systemClock,
      );
    } catch (error) {
      return {
        ok: false,
        code:
          error instanceof DuplicatePlanTitleError
            ? ERROR_CODES.PLAN_DUPLICATE_TITLE
            : ERROR_CODES.PLAN_UPDATE_FAILED,
        message: error instanceof Error ? error.message : "계획을 수정하지 못했습니다.",
      };
    }

    setEditingPlan(null);
    pushToCloud(
      pushPlan(supabasePlanRemote, updated),
      "클라우드 저장",
      ERROR_CODES.PLAN_CLOUD_PUSH_FAILED,
      "인터넷 연결을 확인해주세요. 이 기기에는 저장되어 있습니다.",
    );

    return { ok: true };
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.headerRow}>
        <ThemedText type="title">{monthLabel}</ThemedText>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalOpen(true)}>
          <ThemedText style={styles.addButtonText}>추가</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {plans && plans.length > 0 ? (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.planRow}
              onPress={() =>
                setEditingPlan({ id: item.id, title: item.title, period: item.period })
              }
            >
              <ThemedText>{item.title}</ThemedText>
            </TouchableOpacity>
          )}
        />
      ) : (
        <EmptyState message="아직 이번 달 계획이 없어요" />
      )}

      <PlanFormModal
        visible={isAddModalOpen}
        mode="add"
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddPlan}
      />

      <PlanFormModal
        visible={editingPlan !== null}
        mode="edit"
        initialTitle={editingPlan?.title}
        initialPeriod={editingPlan?.period}
        onClose={() => setEditingPlan(null)}
        onSubmit={handleUpdatePlan}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addButton: {
    backgroundColor: "#208AEF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: "#fff",
  },
  planRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});

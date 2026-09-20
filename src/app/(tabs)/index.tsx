import { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import { AddPlanModal } from "@/components/add-plan-modal";
import { EmptyState } from "@/components/empty-state";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useErrorDialog } from "@/components/error-dialog-provider";
import { ERROR_CODES } from "@/constants/error-codes";
import { db } from "@/data/db";
import migrations from "@/data/migrations/migrations";
import { insertPlan, selectPlans } from "@/data/plan.repository";
import { formatPeriodLabel, getCurrentMonthPeriod } from "@/domain/period";
import { systemClock } from "@/ports/clock";
import { supabasePlanRemote } from "@/ports/plan-remote";
import { supabase } from "@/ports/supabase";
import { pushPlan } from "@/sync/plan-push";

export default function HomeScreen() {
  const { success: migrationsReady, error: migrationError } = useMigrations(db, migrations);
  const { showErrorDialog } = useErrorDialog();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  function handleAddPlan(input: { title: string; period: string }) {
    if (!userId) {
      return;
    }

    let saved;
    try {
      saved = insertPlan(
        db,
        { userId, type: "month", period: input.period, title: input.title },
        systemClock,
      );
    } catch (error) {
      showErrorDialog({
        action: "추가",
        code: ERROR_CODES.PLAN_INSERT_FAILED,
        message: error instanceof Error ? error.message : "계획을 저장하지 못했습니다.",
      });
      return;
    }

    pushPlan(supabasePlanRemote, saved).catch((error) => {
      showErrorDialog({
        action: "클라우드 저장",
        code: ERROR_CODES.PLAN_CLOUD_PUSH_FAILED,
        message:
          error instanceof Error
            ? error.message
            : "인터넷 연결을 확인해주세요. 이 기기에는 저장되어 있습니다.",
      });
    });
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
            <ThemedView style={styles.planRow}>
              <ThemedText>{item.title}</ThemedText>
            </ThemedView>
          )}
        />
      ) : (
        <EmptyState message="아직 이번 달 계획이 없어요" />
      )}

      <AddPlanModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddPlan}
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

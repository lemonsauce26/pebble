import { beforeEach, describe, expect, it } from "vitest";
import { createChunkedStorage, type KeyValueStore } from "./chunked-storage";

function memoryStore() {
  const values = new Map<string, string>();
  const store: KeyValueStore = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
    removeItem: async (key) => {
      values.delete(key);
    },
  };
  return { store, values };
}

const LONG = "가".repeat(3000);

describe("createChunkedStorage", () => {
  let backend: ReturnType<typeof memoryStore>;
  let storage: KeyValueStore;

  beforeEach(() => {
    backend = memoryStore();
    storage = createChunkedStorage(backend.store);
  });

  it("없는 값은 null이다", async () => {
    expect(await storage.getItem("session")).toBeNull();
  });

  it("짧은 값은 쪼개지 않고 그대로 둔다", async () => {
    await storage.setItem("session", "짧다");

    expect(backend.values.get("session")).toBe("짧다");
    expect(await storage.getItem("session")).toBe("짧다");
  });

  it("긴 값은 쪼개 저장했다가 합쳐서 돌려준다", async () => {
    await storage.setItem("session", LONG);

    expect(backend.values.size).toBeGreaterThan(1);
    expect(await storage.getItem("session")).toBe(LONG);
  });

  it("쪼갠 조각은 저장소 한도보다 작다", async () => {
    await storage.setItem("session", LONG);

    for (const [key, value] of backend.values) {
      if (key === "session") {
        continue;
      }
      expect(new TextEncoder().encode(value).length).toBeLessThan(2048);
    }
  });

  it("지우면 조각이 하나도 남지 않는다", async () => {
    await storage.setItem("session", LONG);

    await storage.removeItem("session");

    expect(backend.values.size).toBe(0);
  });

  it("긴 값을 짧은 값으로 덮어써도 옛 조각이 남지 않는다", async () => {
    await storage.setItem("session", LONG);

    await storage.setItem("session", "짧다");

    expect(backend.values.size).toBe(1);
    expect(await storage.getItem("session")).toBe("짧다");
  });

  it("쪼개기 전 방식으로 저장돼 있던 값도 읽힌다", async () => {
    // 이미 로그인해 둔 사람의 세션이 예전 형식으로 들어 있다.
    backend.values.set("session", "예전에 통째로 저장된 값");

    expect(await storage.getItem("session")).toBe("예전에 통째로 저장된 값");
  });

  it("이모지가 조각 경계에 걸려도 깨지지 않는다", async () => {
    const withEmoji = `${"가".repeat(499)}🪨${"나".repeat(600)}`;

    await storage.setItem("session", withEmoji);

    expect(await storage.getItem("session")).toBe(withEmoji);
  });
});

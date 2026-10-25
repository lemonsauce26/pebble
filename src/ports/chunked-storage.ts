export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** 쪼개 저장했다는 표시. 이 글자로 시작하면 뒤에 붙은 숫자가 조각 개수다. */
const CHUNK_MARKER = "__chunked__:";

/**
 * 한 조각의 글자 수. 안전 저장소는 2048바이트를 넘으면 경고하는데,
 * 한글·이모지는 한 글자가 여러 바이트라 가장 긴 경우(4바이트)를 기준으로 잡았다.
 */
const CHUNK_SIZE = 500;

function splitIntoChunks(value: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < value.length) {
    let end = Math.min(start + CHUNK_SIZE, value.length);

    // 이모지처럼 두 칸을 차지하는 글자를 반으로 자르면 깨진다.
    const lastCode = value.charCodeAt(end - 1);
    if (end < value.length && lastCode >= 0xd800 && lastCode <= 0xdbff) {
      end -= 1;
    }

    chunks.push(value.slice(start, end));
    start = end;
  }

  return chunks;
}

/**
 * 긴 값을 여러 조각으로 나눠 저장하는 껍데기.
 * 로그인 세션이 안전 저장소 한도를 넘겨서 필요해졌다. 토큰은 그대로 안전 저장소에 남는다.
 */
export function createChunkedStorage(backend: KeyValueStore): KeyValueStore {
  async function removeChunks(key: string) {
    const head = await backend.getItem(key);
    if (head === null || !head.startsWith(CHUNK_MARKER)) {
      return;
    }

    const count = Number(head.slice(CHUNK_MARKER.length));
    for (let index = 0; index < count; index += 1) {
      await backend.removeItem(`${key}.${index}`);
    }
  }

  return {
    async getItem(key) {
      const head = await backend.getItem(key);

      // 쪼개기 전 방식으로 저장된 값은 통째로 들어 있다.
      if (head === null || !head.startsWith(CHUNK_MARKER)) {
        return head;
      }

      const count = Number(head.slice(CHUNK_MARKER.length));
      const parts: string[] = [];
      for (let index = 0; index < count; index += 1) {
        parts.push((await backend.getItem(`${key}.${index}`)) ?? "");
      }

      return parts.join("");
    },

    async setItem(key, value) {
      await removeChunks(key);

      if (value.length <= CHUNK_SIZE) {
        await backend.setItem(key, value);
        return;
      }

      const chunks = splitIntoChunks(value);
      for (const [index, chunk] of chunks.entries()) {
        await backend.setItem(`${key}.${index}`, chunk);
      }
      await backend.setItem(key, `${CHUNK_MARKER}${chunks.length}`);
    },

    async removeItem(key) {
      await removeChunks(key);
      await backend.removeItem(key);
    },
  };
}

# test/

테스트를 도와주는 공용 코드. 테스트 자체가 아니라 테스트들이 같이 쓰는 도구.

## 포함 예정

- `makeTestDb()` — `:memory:` SQLite를 열고 마이그레이션까지 적용해서 돌려주는 헬퍼
- `aStone()`, `aWeekPocket()` 같은 테스트 데이터 빌더
- `fakeTransport` — `sync/` 테스트용 가짜 Supabase transport

아직 코드 없음 — 다음 단계에서 채운다.

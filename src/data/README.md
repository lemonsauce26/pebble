# data/

Drizzle 스키마 + 마이그레이션 + 리포지토리가 사는 곳. 앱과 테스트가 같은 스키마를 공유한다.

## 규칙

- `domain/`은 import할 수 있다.
- `app/`, `sync/`는 import하지 않는다.
- 리포지토리마다 짝꿍 `*.test.ts`를 둔다 (:memory: SQLite로 검증).

아직 코드 없음 — 다음 단계에서 채운다.

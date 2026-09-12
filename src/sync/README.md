# sync/

로컬 SQLite ↔ Supabase 동기화 엔진(push dirty / pull changed / LWW / 툼스톤).

## 규칙

- `domain/`, `data/`, `ports/`를 import할 수 있다.
- `app/`은 import하지 않는다.
- 실제 전송은 `SyncTransport` 인터페이스 뒤에 두고, 테스트는 가짜(in-memory) transport로 한다.

아직 코드 없음 — Supabase 연결 이후 단계에서 채운다.

# ports/

외부 세계(시간, 난수, 알림, Supabase)에 대한 인터페이스 + 실제 구현 + 테스트용 가짜 구현.

## 포함 예정

- `Clock` — `Date.now()` 대신 주입
- `Random` — `Math.random()` 대신 주입 (시드 가능해야 테스트 재현 가능)
- `Notifier` — expo-notifications 감싸기
- Supabase 클라이언트

## 규칙

- 다른 폴더는 이 폴더의 타입만 import한다. 구현 세부사항에 의존하지 않는다.

아직 코드 없음 — 다음 단계에서 채운다.

# domain/

기획서의 규칙(뽑기, 무게 학습, 개입 타이밍, 주 넘김, 하루 경계, 주 계산, 돌탑 집계)이 순수 함수로 사는 곳.

## 규칙

- React·Expo·SQLite 등 어떤 프레임워크도 import하지 않는다.
- 다른 `src/` 폴더를 import하지 않는다 (완전히 독립).
- `Date.now()` / `Math.random()`을 직접 호출하지 않는다 — `ports/`의 Clock·Random을 주입받는다.
- 함수마다 짝꿍 `*.test.ts`를 같은 폴더에 둔다 (co-located).

아직 코드 없음 — 다음 단계(TDD 1번째 기능)에서 채운다.

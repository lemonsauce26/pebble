import { randomUUID } from "expo-crypto";

// Hermes(RN)에는 전역 crypto.randomUUID가 없어서 expo-crypto로 채워준다.
if (typeof global.crypto === "undefined") {
  // @ts-expect-error - Hermes에는 crypto 전역이 아예 없다
  global.crypto = {};
}
if (typeof global.crypto.randomUUID === "undefined") {
  // expo-crypto의 반환 타입이 표준 UUID 리터럴 타입보다 느슨해서 캐스팅한다
  global.crypto.randomUUID = randomUUID as () => `${string}-${string}-${string}-${string}-${string}`;
}

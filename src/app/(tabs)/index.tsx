import { Redirect } from "expo-router";

/** 앱을 열면 닿는 자리. 첫 화면을 바꾸려면 이 한 줄만 고치면 된다. */
export default function Index() {
  return <Redirect href="/today" />;
}

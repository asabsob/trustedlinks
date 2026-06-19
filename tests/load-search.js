import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "1m", target: 10 },
    { duration: "30s", target: 0 },
  ],
};

export default function () {
  const url =
    `${__ENV.API_BASE_URL}/api/search` +
    `?query=${encodeURIComponent("مشروبات قريبة مني")}` +
    `&lang=ar`;

  const res = http.get(url);

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response under 1s": (r) => r.timings.duration < 1000,
  });

  sleep(1);
}

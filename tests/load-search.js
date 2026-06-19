import http from "k6/http";
import { sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 25 },
    { duration: "2m", target: 50 },
    { duration: "2m", target: 100 },
    { duration: "1m", target: 0 },
  ],
};

export default function () {
  const url =
    `${__ENV.API_BASE_URL}/api/search` +
    `?query=${encodeURIComponent("مشروبات قريبة مني")}` +
    `&lang=ar`;

  const res = http.get(url, { timeout: "10s" });

  if (res.status !== 200) {
    console.log(`FAILED status=${res.status} body=${String(res.body).slice(0, 200)}`);
  }

  sleep(1);
}

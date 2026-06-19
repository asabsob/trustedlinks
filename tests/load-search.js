import http from "k6/http";
import { sleep } from "k6";

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

  http.get(url, { timeout: "10s" });

  sleep(1);
}

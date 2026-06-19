import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "30s", target: 150 },
    { duration: "2m", target: 150 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const url =
    `${__ENV.API_BASE_URL}/api/search` +
    `?query=${encodeURIComponent("كوكو")}` +
    `&lang=ar`;

  const res = http.get(url, {
    timeout: "10s",
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  if (res.status !== 200) {
    console.log(`STATUS=${res.status}`);
  }

  sleep(1);
}

import http from "k6/http";
import { check, sleep } from "k6";

const queries = [
  "مشروبات قريبة مني",
  "مطاعم قريبة مني",
  "كوكو",
  "coco bubble tea",
  "قهوة",
  "كوفي",
  "شاورما",
  "ملابس",
  "صيدلية",
  "عصائر",
];

export const options = {
  stages: [
    { duration: "5m", target: 100 },
    { duration: "30m", target: 100 },
    { duration: "5m", target: 0 },
  ],

  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  const query =
    queries[Math.floor(Math.random() * queries.length)];

  const url =
    `${__ENV.API_BASE_URL}/api/search` +
    `?query=${encodeURIComponent(query)}` +
    `&lang=ar`;

  const res = http.get(url, {
    timeout: "10s",
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  if (res.status !== 200) {
    console.log(`FAILED status=${res.status} query=${query}`);
  }

  sleep(1);
}

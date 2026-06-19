import http from "k6/http";
import { sleep } from "k6";

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
    { duration: "30s", target: 20 },
    { duration: "30s", target: 150 },
    { duration: "2m", target: 150 },
    { duration: "30s", target: 0 },
  ],
};

export default function () {
  const query =
    queries[Math.floor(Math.random() * queries.length)];

  const url =
    `${__ENV.API_BASE_URL}/api/search` +
    `?query=${encodeURIComponent(query)}` +
    `&lang=ar`;

  http.get(url, {
    timeout: "10s",
  });

  sleep(1);
}

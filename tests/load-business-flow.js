import http from "k6/http";
import { check, sleep } from "k6";

const queries = [
  "coco bubble tea",
  "كوكو",
  "مشروبات قريبة مني",
  "مطاعم قريبة مني",
  "قهوة",
  "كوفي",
  "شاورما",
  "عصائر",
];

export const options = {
  stages: [
    { duration: "1m", target: 10 },
    { duration: "3m", target: 25 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    checks: ["rate>0.95"],
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"],
  },
};

export default function () {
  const query = queries[Math.floor(Math.random() * queries.length)];

  const searchRes = http.get(
    `${__ENV.API_BASE_URL}/api/search?query=${encodeURIComponent(query)}&lang=ar`,
    { timeout: "10s" }
  );

  check(searchRes, {
    "search status 200": (r) => r.status === 200,
  });

  if (searchRes.status !== 200) {
    console.log(`SEARCH_FAILED status=${searchRes.status} query=${query}`);
    sleep(1);
    return;
  }

  let businessId;

  try {
    const body = searchRes.json();
    businessId = body?.results?.[0]?.id;
  } catch (e) {
    console.log(`SEARCH_JSON_FAILED query=${query}`);
  }

  if (!businessId) {
    sleep(1);
    return;
  }

  const createLeadRes = http.post(
    `${__ENV.API_BASE_URL}/api/create-lead`,
    JSON.stringify({
      businessId,
      source: query,
      intentType: query.includes("قريبة مني") ? "nearby" : "category",
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: "10s",
    }
  );

  check(createLeadRes, {
    "create lead status 200": (r) => r.status === 200,
  });

  if (createLeadRes.status !== 200) {
    console.log(
      `CREATE_LEAD_FAILED status=${createLeadRes.status} body=${String(
        createLeadRes.body
      ).slice(0, 200)}`
    );
    sleep(1);
    return;
  }

  let token;

  try {
    token = createLeadRes.json()?.token;
  } catch (e) {
    console.log("CREATE_LEAD_JSON_FAILED");
  }

  if (!token) {
    sleep(1);
    return;
  }

  const leadOpenRes = http.get(
    `${__ENV.API_BASE_URL}/l/${token}?acceptConsent=1`,
    {
      timeout: "10s",
      redirects: 0,
      headers: {
        "User-Agent": "Mozilla/5.0 k6-business-flow",
      },
    }
  );

  check(leadOpenRes, {
    "lead open ok": (r) =>
      r.status === 200 || r.status === 302 || r.status === 301,
  });

  if (![200, 301, 302].includes(leadOpenRes.status)) {
    console.log(
      `LEAD_OPEN_FAILED status=${leadOpenRes.status} token=${token} body=${String(
        leadOpenRes.body
      ).slice(0, 200)}`
    );
  }

  sleep(2);
}

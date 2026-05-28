import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import businessRoutes from "./routes/business.routes.js";

const app = express();

const isProd = process.env.NODE_ENV === "production";

const corsOptions = {
  origin: [
    "https://trustedlinks.net",
    "http://localhost:5173",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
    contentSecurityPolicy: false,
  })
);

app.use(
  morgan(isProd ? "combined" : "dev")
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    service: "trustedlinks-api",
  });
});

app.use("/api/business", businessRoutes);

export default app;

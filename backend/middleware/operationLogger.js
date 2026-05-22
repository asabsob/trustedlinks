import { logAIEvent } from "../services/ai/logAIEvent.js";

export async function logOperationEvent({
  type = "system",
  level = "info",
  source = "",
  action = "",
  status = "success",
  message = "",
  meta = {},
}) {
  return logAIEvent({
    type,
    level,
    source,
    action,
    status,
    message,
    meta,
  });
}

export function operationErrorLogger(err, req, res, next) {
  console.error("GLOBAL_OPERATION_ERROR", err);

  logOperationEvent({
    type: "api_error",
    level: "error",
    source: "express",
    action: `${req.method} ${req.originalUrl}`,
    status: "failed",
    message: err.message,
    meta: {
      path: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
    },
  });

  next(err);
}

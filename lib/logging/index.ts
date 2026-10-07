type LogLevel = "info" | "warn" | "error";

interface LogEvent {
  level: LogLevel;
  event: string;
  meta?: Record<string, string | number | boolean>;
}

export function log(event: string, meta?: Record<string, string | number | boolean>) {
  writeLog({ level: "info", event, meta });
}

export function logWarn(event: string, meta?: Record<string, string | number | boolean>) {
  writeLog({ level: "warn", event, meta });
}

export function logError(event: string, meta?: Record<string, string | number | boolean>) {
  writeLog({ level: "error", event, meta });
}

function writeLog(entry: LogEvent) {
  const payload = {
    ts: new Date().toISOString(),
    ...entry,
  };
  const line = JSON.stringify(payload);
  if (entry.level === "error") {
    console.error(line);
  } else if (entry.level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

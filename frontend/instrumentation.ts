import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const parseHeaders = (headersString?: string): Record<string, string> => {
  if (!headersString) return {};
  const headers: Record<string, string> = {};

  headersString.split(",").forEach((pair) => {
    const [key, ...valueParts] = pair.split("=");
    if (!key || !valueParts.length) return;
    headers[key.trim()] = valueParts.join("=").trim();
  });

  return headers;
};

const normalizeBaseUrl = (endpoint?: string): string => {
  if (!endpoint) return "http://localhost:4318";
  return endpoint.replace(/\/v1\/(traces|metrics)$/, "");
};

const baseUrl = normalizeBaseUrl(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
const headers = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);
const serviceName = process.env.OTEL_SERVICE_NAME || "frontend";

const traceExporter = new OTLPTraceExporter({
  url: `${baseUrl}/v1/traces`,
  headers,
});

const metricExporter = new OTLPMetricExporter({
  url: `${baseUrl}/v1/metrics`,
  headers,
});

const sdk = new NodeSDK({
  serviceName,
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
});

// ---- Correct non-promise startup wrapper ----
(async () => {
  try {
    if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      await sdk.start();
      console.log(`[OTEL] Started for service: ${serviceName}`);
      console.log(`[OTEL] Exporting to: ${baseUrl}`);
    } else {
      console.log("[OTEL] No OTLP endpoint configured, skipping.");
    }
  } catch (err) {
    console.error("[OTEL] Failed to start:", err);
  }
})();

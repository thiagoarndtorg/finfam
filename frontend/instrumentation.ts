import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

const exporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  headers: {
    Authorization: process.env.OTEL_EXPORTER_OTLP_HEADERS!,
  },
});

export const sdk = new NodeSDK({
  traceExporter: exporter,
});

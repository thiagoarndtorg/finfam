import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

// Parse headers if provided
const parseHeaders = (headersString?: string): Record<string, string> => {
  if (!headersString) return {};
  const headers: Record<string, string> = {};
  
  // Handle format: "Authorization=Basic ..." or "key=value,key2=value2"
  if (headersString.includes('=')) {
    headersString.split(',').forEach(header => {
      const [key, ...valueParts] = header.split('=').map(s => s.trim());
      const value = valueParts.join('='); // Rejoin in case value contains '='
      if (key && value) {
        headers[key] = value;
      }
    });
  }
  
  return headers;
};

// Get base URL - handle Grafana Cloud endpoint format
const getBaseUrl = (endpoint?: string): string => {
  if (!endpoint) return 'http://localhost:4318';
  
  // Grafana Cloud format: https://otlp-gateway-*.grafana.net/otlp
  // Remove /v1/metrics or /v1/traces if present
  let baseUrl = endpoint.replace(/\/v1\/(metrics|traces)$/, '');
  
  // If endpoint ends with /otlp, keep it (Grafana Cloud format)
  // If it doesn't, it's probably a local collector
  if (!baseUrl.endsWith('/otlp') && !baseUrl.includes('localhost')) {
    baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }
  
  return baseUrl;
};

const baseUrl = getBaseUrl(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
const headers = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);

const traceExporter = new OTLPTraceExporter({
  url: `${baseUrl}/v1/traces`,
  headers: headers,
});

const metricExporter = new OTLPMetricExporter({
  url: `${baseUrl}/v1/metrics`,
  headers: headers,
});

export const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME || 'fin-fam-frontend',
  traceExporter: traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000, // Export metrics every 10 seconds
  }),
});

sdk.start();
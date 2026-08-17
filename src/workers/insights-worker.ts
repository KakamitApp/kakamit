import { computeInsights } from '../lib/insights';

self.onmessage = (e: MessageEvent) => {
  const entries = e.data;
  const insights = computeInsights(entries);
  self.postMessage(insights);
};

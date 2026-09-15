#!/usr/bin/env node
/**
 * Submit all pvfcalculator.com URLs to IndexNow.
 * Run after deploying a batch of new or updated pages:
 *   node scripts/indexnow-submit.js
 *
 * Requires: Node 18+
 * TODO: Replace the key below with your actual IndexNow key.
 */

const KEY = "pvfcalculator-indexnow-key"; // must match /pvfcalculator-indexnow-key.txt in public/
const HOST = "pvfcalculator.com";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const URLS = [
  `https://${HOST}/`,
  `https://${HOST}/flange-weight-calculator/`,
  `https://${HOST}/elbow-weight-calculator/`,
  `https://${HOST}/tee-weight-calculator/`,
  `https://${HOST}/reducer-weight-calculator/`,
  `https://${HOST}/pipe-weight-calculator/`,
  `https://${HOST}/pipe-schedule-chart/`,
  `https://${HOST}/asme-b16-5-flange-dimensions/`,
  `https://${HOST}/asme-b16-9-fitting-dimensions/`,
  `https://${HOST}/request-a-quote/`,
  `https://${HOST}/blog/`,
  `https://${HOST}/blog/why-flange-calculators-are-wrong/`,
  `https://${HOST}/blog/pipe-fitting-weight-calculator-comparison/`,
  `https://${HOST}/blog/flange-weight-chart-errors/`,
  `https://${HOST}/blog/mss-sp-75-vs-asme-b16-9/`,
  `https://${HOST}/blog/flange-facing-types/`,
  `https://${HOST}/blog/piping-class-chart/`,
  `https://${HOST}/blog/pipe-schedule-chart-explained/`,
  `https://${HOST}/blog/asme-b16-5-vs-b16-47/`,
  `https://${HOST}/blog/304-vs-316-stainless-steel-flanges/`,
  `https://${HOST}/blog/how-to-choose-flange-class/`,
  `https://${HOST}/cangzhou-flange-manufacturers/`,
  `https://${HOST}/privacy/`,
  `https://${HOST}/terms/`,
  `https://${HOST}/disclaimer/`,
];

const ENDPOINT = "https://api.indexnow.org/indexnow";

async function submit() {
  const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: URLS });
  console.log(`Submitting ${URLS.length} URLs to IndexNow…`);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body,
    });
    console.log(`Response: ${res.status} ${res.statusText}`);
    if (res.status === 200) {
      console.log("✓ Submission accepted.");
    } else if (res.status === 202) {
      console.log("✓ Submission queued for processing.");
    } else {
      const text = await res.text();
      console.error("Unexpected response:", text);
    }
  } catch (err) {
    console.error("Submission failed:", err.message);
  }
}

submit();

import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VerificationEvidence } from "../src/components/VerificationEvidence";

test("supplemental WARN presents all three matching fragments and scope without a percentage", () => {
  const html = renderToStaticMarkup(createElement(VerificationEvidence, { verification: {
    status: "VERIFIED", evidence: { decision: "WARN", similarityScore: .482, reviewRequired: true,
      evaluationScope: "ai_labeled", referenceTracks: 34, pureAiCreationVerified: false,
      thresholds: { warn: .347, hold: .834 }, similarTracks: [{ trackId: "reference-work", score: .482,
        matchedSegments: [0, 20, 40].map(start => ({ queryStartSec: start, queryEndSec: start + 10, refStartSec: start + 30, refEndSec: start + 40, score: .9 })) }] } } }));
  assert.match(html, /WARN/); assert.match(html, /0\.4820/);
  assert.equal((html.match(/내 음원/g) || []).length, 3);
  assert.match(html, /34곡/); assert.match(html, /자동 등록이 보류/); assert.doesNotMatch(html, /48\.20%/);
});
test("failed analysis and a record without evidence do not turn into a PASS", () => {
  const failed = renderToStaticMarkup(createElement(VerificationEvidence, { verification: { status: "REJECTED", errorCode: "AI_TIMEOUT" } }));
  assert.match(failed, /분석 실패/); assert.doesNotMatch(failed, />PASS</);
  const missing = renderToStaticMarkup(createElement(VerificationEvidence, { verification: { status: "VERIFIED", riskScore: ".72" } }));
  assert.match(missing, /판정 근거 미제공/); assert.doesNotMatch(missing, />PASS</);
});

/**
 * Bank Webhook Security, Idempotency & Diacritics Normalization Unit Tests
 */

import { normalizeDiacritics, sanitizeCurrencyAmount } from './test-utils';

/**
 * Validates webhook authentication headers (x-api-key or Authorization: Bearer <secret>).
 */
export const validateWebhookAuth = (
  headers: Record<string, string | undefined>,
  expectedSecret: string
): { authorized: boolean; statusCode: number; message?: string } => {
  const apiKey = headers['x-api-key'] || headers['authorization'];
  if (!expectedSecret || (apiKey !== expectedSecret && apiKey !== `Bearer ${expectedSecret}`)) {
    return {
      authorized: false,
      statusCode: 401,
      message: "Không có quyền truy cập Webhook - Invalid Secret Key"
    };
  }
  return { authorized: true, statusCode: 200 };
};

/**
 * In-memory idempotency tracker for banking webhook transactions.
 */
export class WebhookIdempotencyTracker {
  private processedIds = new Set<string>();

  public processTransaction(transactionId: string): {
    isDuplicate: boolean;
    statusCode: number;
    processed: boolean;
    message: string;
  } {
    if (this.processedIds.has(transactionId)) {
      return {
        isDuplicate: true,
        statusCode: 200,
        processed: true,
        message: "Giao dịch đã được đối soát từ trước"
      };
    }
    this.processedIds.add(transactionId);
    return {
      isDuplicate: false,
      statusCode: 200,
      processed: true,
      message: "Giao dịch hợp lệ, đang xử lý"
    };
  }

  public hasProcessed(transactionId: string): boolean {
    return this.processedIds.has(transactionId);
  }
}

/**
 * Parses and extracts SHOW or PHAT identifiers from Vietnamese bank transfer descriptions.
 */
export const parseNormalizedTransferContent = (
  content: string
): { showId: string | null; userId: string | null; normalizedText: string } => {
  if (!content) return { showId: null, userId: null, normalizedText: "" };

  const normalized = normalizeDiacritics(content)
    .toUpperCase()
    .replace(/[-_.]/g, " ")
    .trim();

  const showMatch = normalized.match(/SHOW\s*([A-F0-9]{24})/i);
  const fineMatch = normalized.match(/PHAT\s*([A-F0-9]{24})/i);

  return {
    showId: showMatch ? showMatch[1].toLowerCase() : null,
    userId: fineMatch ? fineMatch[1].toLowerCase() : null,
    normalizedText: normalized
  };
};

export const runWebhookTests = (): { passed: boolean; details: string[] } => {
  const details: string[] = [];
  let passed = true;
  const expectedSecret = "fptu_webhook_secret_key_8888";

  // ----------------------------------------------------
  // Test 1: Secret Header Validation via x-api-key
  // ----------------------------------------------------
  const authApiKey = validateWebhookAuth({ 'x-api-key': expectedSecret }, expectedSecret);
  if (authApiKey.authorized && authApiKey.statusCode === 200) {
    details.push("✅ Test 1 Passed: Authorized webhook with 'x-api-key' header.");
  } else {
    passed = false;
    details.push("❌ Test 1 Failed: Expected authorization with x-api-key.");
  }

  // ----------------------------------------------------
  // Test 2: Secret Header Validation via Authorization: Bearer <secret>
  // ----------------------------------------------------
  const authBearer = validateWebhookAuth({ 'authorization': `Bearer ${expectedSecret}` }, expectedSecret);
  if (authBearer.authorized && authBearer.statusCode === 200) {
    details.push("✅ Test 2 Passed: Authorized webhook with 'Authorization: Bearer <secret>' header.");
  } else {
    passed = false;
    details.push("❌ Test 2 Failed: Expected authorization with Bearer header.");
  }

  // ----------------------------------------------------
  // Test 3: Missing or Invalid Secret Rejection with 401
  // ----------------------------------------------------
  const authWrong = validateWebhookAuth({ 'x-api-key': 'tampered_key_999' }, expectedSecret);
  const authMissing = validateWebhookAuth({}, expectedSecret);
  if (
    !authWrong.authorized && authWrong.statusCode === 401 &&
    !authMissing.authorized && authMissing.statusCode === 401
  ) {
    details.push("✅ Test 3 Passed: Rejected invalid and missing webhook secrets with HTTP 401.");
  } else {
    passed = false;
    details.push("❌ Test 3 Failed: Invalid or missing secret was not rejected with 401.");
  }

  // ----------------------------------------------------
  // Test 4: Webhook Idempotency & Repeat Protection
  // ----------------------------------------------------
  const tracker = new WebhookIdempotencyTracker();
  const txnId = "TXN_VIETQR_20261116_0001";

  const firstCall = tracker.processTransaction(txnId);
  const secondCall = tracker.processTransaction(txnId);

  if (
    !firstCall.isDuplicate && firstCall.statusCode === 200 &&
    secondCall.isDuplicate && secondCall.statusCode === 200 &&
    secondCall.processed === true &&
    secondCall.message.includes("đối soát từ trước")
  ) {
    details.push("✅ Test 4 Passed: Transaction idempotency verified: repeats return 200 processed:true without duplicate processing.");
  } else {
    passed = false;
    details.push("❌ Test 4 Failed: Idempotency check failed for repeated transaction.");
  }

  // ----------------------------------------------------
  // Test 5: Formatted Currency String Sanitization (No NaN)
  // ----------------------------------------------------
  const testAmounts = [
    { input: "1,000,000 VND", expected: 1000000 },
    { input: "2.500.000 đ", expected: 2500000 },
    { input: " 500,000 ", expected: 500000 },
    { input: 2000000, expected: 2000000 },
    { input: "10,500,000.00", expected: 10500000 },
    { input: "abc_non_number", expected: 0 },
    { input: null, expected: 0 },
    { input: undefined, expected: 0 }
  ];

  let currencySanitizerOk = true;
  for (const item of testAmounts) {
    const res = sanitizeCurrencyAmount(item.input);
    if (res !== item.expected || isNaN(res)) {
      currencySanitizerOk = false;
      details.push(`❌ Test 5 Subcase Failed for "${item.input}": expected ${item.expected}, got ${res}`);
    }
  }

  if (currencySanitizerOk) {
    details.push("✅ Test 5 Passed: Formatted currency strings properly sanitized to integer VND (no NaN).");
  } else {
    passed = false;
  }

  // ----------------------------------------------------
  // Test 6: Vietnamese Diacritics Normalization for Matching
  // ----------------------------------------------------
  const sampleShowId = "65d83f12a4b8c9123456789a";
  const sampleUserId = "65d83f12a4b8c9123456789b";

  // SHOW transfer with diacritics
  const p1 = parseNormalizedTransferContent(`THANH TOÁN SHOW ${sampleShowId} ĐÃ HOÀN TẤT`);
  // PHAT transfer with Vietnamese special chars "Ạ"
  const p2 = parseNormalizedTransferContent(`Nộp tiền PHẠT-${sampleUserId} trễ giờ tập`);
  // Special letter "Đ" and "Ô"
  const p3 = parseNormalizedTransferContent(`ĐÓNG TIỀN SHÔW_${sampleShowId}`);

  if (p1.showId === sampleShowId && p2.userId === sampleUserId && p3.showId === sampleShowId) {
    details.push("✅ Test 6 Passed: Vietnamese diacritics successfully normalized for SHOW and PHAT regex extraction.");
  } else {
    passed = false;
    details.push(`❌ Test 6 Failed: Normalization failed: p1=${p1.showId}, p2=${p2.userId}, p3=${p3.showId}`);
  }

  // ----------------------------------------------------
  // Test 7: Irrelevant Banking Content Safely Returns Null IDs
  // ----------------------------------------------------
  const irrelevant = parseNormalizedTransferContent("Chuyen tien an trua 50k quan com binh dan");
  if (irrelevant.showId === null && irrelevant.userId === null) {
    details.push("✅ Test 7 Passed: Irrelevant bank transfer content safely returns null IDs.");
  } else {
    passed = false;
    details.push("❌ Test 7 Failed: Irrelevant transfer falsely matched an ID.");
  }

  return { passed, details };
};

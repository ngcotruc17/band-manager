/**
 * Main Test Runner Executable - FPTU Band Manager Ecosystem v2.0
 * Coordinates all Unit, Integration & Pure Domain Test Suites (Tiers 1-4)
 */

import { runFinanceTests } from './finance.test';
import { runAuthTests } from './auth.test';
import { runRehearsalTests } from './rehearsal.test';
import { runShowTests } from './show.test';
import { runWebhookTests } from './webhook.test';
import { runAuthMiddlewareTests } from './auth-middleware.test';
import { runClientPureTests } from './client-pure.test';

async function main() {
  console.log("==================================================");
  console.log("🧪 Running FPTU Band Manager v2 Automated Test Suites (Tiers 1-4)");
  console.log("==================================================\n");

  const suites: Array<{
    name: string;
    run: () => { passed: boolean; details: string[] } | Promise<{ passed: boolean; details: string[] }>;
  }> = [
    { name: "1. Finance & Reconciliation Suite", run: runFinanceTests },
    { name: "2. Auth & RBAC Token Suite", run: runAuthTests },
    { name: "3. Rehearsal & Attendance Discipline Suite", run: runRehearsalTests },
    { name: "4. Show Lifecycle & Salary Split Matrix Suite", run: runShowTests },
    { name: "5. Bank Webhook & Currency Sanitization Suite", run: runWebhookTests },
    { name: "6. Auth Middleware & Role Guards Suite", run: runAuthMiddlewareTests },
    { name: "7. Client Pure Domain Logic & Transposition Suite", run: runClientPureTests },
  ];

  let totalSuites = 0;
  let passedSuites = 0;
  let totalCases = 0;
  let passedCases = 0;
  let allPassed = true;

  for (const suite of suites) {
    console.log(`--- [Suite ${suite.name}] ---`);
    totalSuites++;
    try {
      const res = await suite.run();
      res.details.forEach(d => {
        console.log(`  ${d}`);
        totalCases++;
        if (d.includes("✅")) {
          passedCases++;
        }
      });
      if (res.passed) {
        passedSuites++;
      } else {
        allPassed = false;
      }
    } catch (err: any) {
      allPassed = false;
      console.error(`  ❌ Suite Execution Crash: ${err?.message || err}`);
    }
    console.log("");
  }

  console.log("==================================================");
  console.log(`📊 TEST SUMMARY: ${passedSuites}/${totalSuites} Suites Passed, ${passedCases}/${totalCases} Test Cases Passed`);
  console.log("==================================================");

  if (allPassed && passedSuites === totalSuites && passedCases === totalCases) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! Codebase is healthy (100% pass rate).");
    console.log("==================================================");
    process.exit(0);
  } else {
    console.error("❌ TEST SUITE FAILED. Please review error outputs above.");
    console.log("==================================================");
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});

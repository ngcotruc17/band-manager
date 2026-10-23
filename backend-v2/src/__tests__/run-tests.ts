/**
 * Main Test Runner Executable
 */
import { runFinanceTests } from './finance.test';
import { runAuthTests } from './auth.test';

console.log("==================================================");
console.log("🧪 Running Sắc Band Manager v2 Unit & Integration Tests");
console.log("==================================================\n");

const financeResults = runFinanceTests();
financeResults.details.forEach(d => console.log(d));

console.log("");
const authResults = runAuthTests();
authResults.details.forEach(d => console.log(d));

console.log("\n==================================================");

const allPassed = financeResults.passed && authResults.passed;

if (allPassed) {
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! Codebase is healthy.");
  console.log("==================================================");
  process.exit(0);
} else {
  console.error("❌ TEST SUITE FAILED. Please review error outputs above.");
  console.log("==================================================");
  process.exit(1);
}

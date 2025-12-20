# **AI-NextJS Test Coverage Strategy**

**Objective:** To build confidence in AI-generated Next.js applications by tracking not just *how much* code runs (numerical coverage), but *what features* work (functional coverage) and *how robust* the tests are (mutation coverage).

## **The Three-Tier Coverage Model**

| Tier | Metric | Question Answered | Tooling |
| :---- | :---- | :---- | :---- |
| **1** | **Numerical** | Did the code run? (Total Line Coverage) | Jest (Unit) \+ Playwright (E2E) \+ NYC (Merge) |
| **2** | **Functional** | Did the business requirements pass? | Cucumber / Gherkin |
| **3** | **Mutation** | Are the tests actually useful or just "green"? | Stryker Mutator |

## **Tier 1: Numerical Coverage (Instrumentation)**

To get a complete picture, we must combine **Unit Test** coverage (logic) with **E2E Test** coverage (user flows).

### **A. Unit Tests (Jest)**

Jest handles coverage natively, but we must configure it to output **JSON** so it can be merged later.

1\. Update jest.config.js  
Ensure your config includes these coverage options. We output to coverage/unit to keep it separate from E2E data.  
const nextJest \= require('next/jest');  
const createJestConfig \= nextJest({ dir: './' });

const customJestConfig \= {  
  // ... existing setup ...  
  collectCoverage: true,  
  coverageDirectory: '\<rootDir\>/coverage/unit',  
  // 'json' is required for merging. 'html' is for local viewing.  
  coverageReporters: \['json', 'html', 'text'\],   
  testMatch: \['\*\*/\*.test.ts', '\*\*/\*.test.tsx'\],  
};

module.exports \= createJestConfig(customJestConfig);

### **B. E2E Tests (Playwright/Cypress)**

Standard E2E tests run against compiled code. We must "instrument" the code to track execution back to source files.

**1\. Install Dependencies**

npm install \-D swc-plugin-coverage-instrument cross-env nyc

2\. Configure next.config.js  
We use an environment variable (INSTRUMENT\_CODE) to prevent bloating production builds.  
/\*\* @type {import('next').NextConfig} \*/  
const nextConfig \= {  
  experimental: {  
    swcPlugins: process.env.INSTRUMENT\_CODE  
      ? \[\['swc-plugin-coverage-instrument', {}\]\]  
      : \[\],  
  },  
};  
module.exports \= nextConfig;

**3\. Collect Coverage (Choose Your Runner)**

* Option 1: Playwright (Recommended)  
  Playwright needs a fixture to save the window coverage object to a file.  
  Create e2e/fixtures.ts:  
  import { test as baseTest } from '@playwright/test';  
  import fs from 'fs';  
  import path from 'path';

  export const test \= baseTest.extend({  
    context: async ({ context }, use) \=\> {  
      await context.addInitScript(() \=\>  
        window.addEventListener('beforeunload', () \=\>  
          (window as any).collectIstanbulCoverage(JSON.stringify((window as any).\_\_coverage\_\_))  
        )  
      );

      await fs.promises.mkdir('coverage/e2e', { recursive: true });

      await context.exposeBinding('collectIstanbulCoverage', async (\_, coverageJSON) \=\> {  
        if (coverageJSON) {  
          await fs.promises.writeFile(  
            path.join('coverage/e2e', \`coverage-${Date.now()}.json\`),  
            coverageJSON  
          );  
        }  
      });

      await use(context);

      // Capture final state  
      for (const page of context.pages()) {  
          const coverage \= await page.evaluate(() \=\> (window as any).\_\_coverage\_\_);  
          if (coverage) {  
              await fs.promises.writeFile(  
                  path.join('coverage/e2e', \`coverage-final-${Date.now()}.json\`),  
                  JSON.stringify(coverage)  
              );  
          }  
      }  
    },  
  });

* Option 2: Cypress  
  Install @cypress/code-coverage and add coverageTask(on, config) to your cypress.config.ts. (Detailed steps in previous section). Ensure it outputs to coverage/e2e.

### **C. The Unified Report (Merging)**

Now we merge coverage/unit/\*.json and coverage/e2e/\*.json into one report.

**1\. Add Scripts to package.json**

"scripts": {  
  "test:unit": "jest",  
  "test:e2e": "cross-env INSTRUMENT\_CODE=1 playwright test",  
  "//": "--- MERGING SCRIPTS \---",  
  "pretest:merge": "mkdir \-p coverage/merged",  
  "test:merge": "nyc merge coverage coverage/merged/coverage.json",  
  "posttest:merge": "nyc report \--reporter=html \--reporter=text \--temp-dir=coverage/merged \--report-dir=coverage/total",  
  "audit:coverage": "npm run test:unit && npm run test:e2e && npm run test:merge"  
}

**Result:** Open coverage/total/index.html. You will see a combined view where:

* **Unit Tests** cover your utilities and hooks.  
* **E2E Tests** cover your page interactions.  
* The "Total" % is your true application health.

## **Tier 2: Functional Coverage (BDD)**

Numerical coverage tells you *if* code ran. Functional coverage tells you *why* it ran.

1\. Feature Files (The Contract)  
Write requirements in Gherkin (.feature).  
Feature: Login  
  Scenario: User enters invalid email  
    Given I am on "/login"  
    When I enter "bad-email"  
    Then I should see "Invalid format"

2\. Linking Unit Tests  
For unit tests, force the AI to include Requirement IDs in descriptions.  
// \[REQ-AUTH-01\] Email Validation  
describe('validateEmail (REQ-AUTH-01)', () \=\> {  
  it('rejects non-email strings', () \=\> { ... });  
});

*Audit Strategy:* Search your repo for REQ-\* tags to find untested requirements.

## **Tier 3: Mutation Coverage (Confidence)**

Mutation testing runs primarily on **Unit Tests** (Jest). It is too slow for E2E.

**1\. Install Stryker**

npm install \-D @stryker-mutator/core @stryker-mutator/jest-runner

**2\. Configure stryker.config.json**

{  
  "$schema": "./node\_modules/@stryker-mutator/core/schema/stryker-schema.json",  
  "packageManager": "npm",  
  "reporters": \["html", "clear-text"\],  
  "testRunner": "jest",  
  "coverageAnalysis": "perTest",  
  "mutate": \[  
    "src/lib/\*\*/\*.ts",  
    "src/utils/\*\*/\*.ts",  
    "\!src/\*\*/\*.test.ts"  
  \]  
}

3\. Run & Analyze  
npx stryker run

* **Killed:** Good test.  
* **Survived:** The test passed even when logic was broken. **Rewrite this test.**

## **Applying to Existing Projects (Migration Guide)**

When working with a project that already has Jest and Playwright tests, do not rewrite everything at once. Use this **"Non-Destructive Adoption"** flow:

### **Phase 1: The Baseline (Zero-Code Change)**

Before changing any test logic, simply turn on the lights to see what you are currently covering.

1. **Modify Configs:** Update jest.config.js and next.config.js as shown in Tier 1\. This affects *how* tests run, not *what* they test.  
2. **Update Playwright:** If you have existing tests like example.spec.ts, update them to use the test fixture from fixtures.ts instead of the default @playwright/test.  
   * *Diff:* import { test, expect } from './fixtures'; (instead of @playwright/test)  
3. **Run the Audit:** Run npm run audit:coverage.  
   * *Result:* You will likely find your E2E tests cover 60-70% of your code implicitly. This gives you a massive confidence boost immediately.

### **Phase 2: The "Critical Path" Pilot (BDD)**

Do not convert old tests to BDD. Keep them as "Regression Tests." Start BDD for the *next* feature or the most critical current feature.

1. **Pick a Flow:** e.g., "User Checkout."  
2. **Reverse Engineer:** Ask AI: *"Read src/pages/checkout.tsx. Write a Gherkin .feature file that covers the existing behavior."*  
3. **Implement:** Use playwright-bdd to implement *only* this new feature file.  
4. **Compare:** Now you have legacy tests (standard Playwright) running alongside new tests (BDD). They coexist happily.

### **Phase 3: Retroactive Tagging (Unit Tests)**

You have hundreds of unit tests without tags.

1. **AI Audit:** Paste your utils.test.ts into the AI.  
2. **Prompt:** *"Analyze these tests. Group them by functionality and rewrite the describe block titles to include a hypothetical Requirement ID (e.g., \[UTIL-DATE-01\])."*  
3. **Apply:** Paste the tagged code back. Now your functional coverage report starts populating without writing new tests.

## **Summary Checklist**

1. **Run Unit Tests:** npm run test:unit \-\> Generates coverage/unit/coverage-final.json.  
2. **Run E2E Tests:** npm run test:e2e \-\> Generates coverage/e2e/coverage-\*.json.  
3. **Merge:** npm run test:merge \-\> Combines them.  
4. **View Report:** Open coverage/total/index.html.  
5. **Verify Quality:** Run npx stryker run on core logic.
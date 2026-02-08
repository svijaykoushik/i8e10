# UX Guidelines

## Core UX Principles

### 1. Low Friction Data Entry
**Goal**: Minimizing the cognitive load and physical interactions required to input data.
*   **Defaults**: Always default `Date` to *Today* and `Wallet` to the *Default Wallet*.
*   **Suggestions**: Provide "Pill" suggestions for common text inputs (e.g., "Salary", "Groceries") to allow one-tap entry.
*   **Focus**: Automatically focus the most important field (usually `Amount`) when a form opens.
*   **Keyboard Layout**: Ensure numeric keypads trigger for money fields on mobile.

### 2. Bilingual Hierarchy (English Primary + Tamil Secondary)
**Goal**: Make the app accessible to Tamil speakers while maintaining a clean English interfaces for speed.
*   **Pattern**: `English Label / தமிழ் மொழிபெயர்ப்பு`
*   **Usage**:
    *   **Titles & Headers**: "Total Balance / மொத்த இருப்பு"
    *   **Form Labels**: "Amount / தொகை"
    *   **Status Messages**: "Healthy / ஆரோக்கியம்"
*   **Rationale**: English serves as the primary scanning language for common terms. Tamil provides emotional weight and clarity for native speakers.

### 3. Simplification of Concepts
**Goal**: Reduce financial jargon.
*   **Balance Sheet** $\rightarrow$ "Net Worth" or "What you Own vs Owe".
*   **Cash Flow** $\rightarrow$ "Money In vs Money Out".
*   **Reconciliation** $\rightarrow$ "Adjust Balance".

---

## Guidelines for Human-Centric Data Representation

### 1. Principle of Natural Frequencies
**Guideline**: Prefer "Natural Frequencies" (X out of Y) over abstract percentages whenever the user needs to assess risk or distribution.
*   **Why**: Percentages require a two-step mental translation. Natural frequencies map directly to human "count-based" evolutionary logic.
*   **Application**:
    *   *Bad*: "Savings rate is 20%."
    *   *Good*: "You saved ₹1 out of every ₹5 earned."

### 2. Mitigate Ratio Bias
**Guideline**: Maintain a consistent denominator when comparing different data sets.
*   **Why**: Users struggle to compare 1/10 vs. 10/100 intuitively. By keeping the "base" number the same, you eliminate the cognitive load of finding a common denominator.
*   **Application**: Instead of comparing a 5% expense growth to a 10% income growth, show them both as "₹5 per ₹100" vs "₹10 per ₹100."

### 3. Absolute Value Transparency (Avoid Denominator Neglect)
**Guideline**: Never show a percentage change without the underlying absolute value.
*   **Why**: A "100% increase" in a category could mean a jump from ₹1 to ₹2 or ₹10k to ₹20k. Without the base number, the user cannot prioritize the significance.
*   **Application**: "Entertainment spending is up 50% (+₹2,000)."

### 4. Visual Encoding (The Icon Array)
**Guideline**: Use **Icon Arrays** or **Unit Charts** instead of Pie Charts for part-to-whole relationships.
*   **Why**: Pie charts rely on judging angles and areas, which humans are notoriously bad at. Icon arrays allow the brain to "count" or "subitize" (instantly recognize small numbers) the data points.

---

## Implementation Checklist

| Context | Professional Standard | i8e10 Human-Centric Standard |
| :--- | :--- | :--- |
| **Budget Progress** | 85% Consumed | "₹15 left for every ₹100 budgeted" |
| **Investment ROI** | +12% YoY | "Your money grew by ₹12 for every ₹100 invested" |
| **Expense Split** | Pie Chart | Icon Grid (100 blocks) |
| **Debt Payoff** | 40% Paid | "4 out of 10 milestones completed" |
| **Debt Ratio** | 50% Debt-to-Asset | "You owe ₹50 for every ₹100 you own" |

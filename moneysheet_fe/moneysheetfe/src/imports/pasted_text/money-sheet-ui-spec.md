Create a mobile-first web app UI for a personal finance product called “MoneySheet”.

This product helps a single user manage a monthly ledger, daily spending, food budget, fixed expenses, and monthly reports. The UI should feel like Google Spreadsheet reinterpreted as a clean, modern mobile finance app. Do not make it look like a generic banking app. The design should be practical, grid-based, data-dense, and highly readable.

Product goals:
- Let the user quickly record daily expenses
- Let the user compare actual balance vs calculated balance
- Let the user track food budget separately from other spending
- Let the user manage recurring fixed expenses
- Let the user understand monthly totals and saving amount at a glance

Platform:
- Mobile-first web app
- Primary frame size: 390x844
- Light mode only
- Responsive-ready structure, but design for mobile first

Visual direction:
- Inspired by Google Spreadsheet
- White background with subtle gray sheet sections
- Clear grid lines and table logic
- Strong readability for numbers
- Minimal decorative elements
- More like a structured financial workspace than a lifestyle app

Color direction:
- Background: white
- Section background: very light gray
- Grid/border: soft gray
- Primary highlight: spreadsheet-like green
- Info/action blue for links and interactive controls
- Red for overspending, mismatch, warnings
- Neutral gray for secondary text

Typography and hierarchy:
- Prioritize numeric readability
- Large bold monthly summary numbers
- Medium-weight section labels
- Compact row-based financial data presentation
- Make totals and warnings very easy to scan

Navigation:
- Bottom tab navigation with 4 tabs:
  - Home
  - Ledger
  - Report
  - Settings
- Use clear screen-to-screen navigation between summary, monthly ledger, daily detail, and expense form

Design system behavior:
- Reuse components across screens
- Create consistent table rows, summary cards, form inputs, tags, and status chips
- Make editable fields feel obvious
- Show financial states clearly: normal, overspent, mismatch, empty, and error

Create these 7 screens:

1. Home / Monthly Summary
- Purpose: show the user the current monthly financial state at a glance
- Include:
  - current month label
  - monthly income
  - total expense
  - saving amount
  - food budget
  - remaining food budget
  - actual vs calculated balance mismatch alert
  - CTA buttons or entry points to Monthly Ledger, Budget Settings, Fixed Expense Management, Monthly Report
- Layout should feel like a summary dashboard made from spreadsheet-like sections

2. Monthly Ledger
- Purpose: show a month-level ledger view by date
- Use a spreadsheet-like table layout optimized for mobile
- Each date row should include:
  - date
  - actual balance
  - calculated balance
  - daily expense total
  - note indicator
- The screen should feel like a ledger sheet, not a calendar
- User should be able to tap a row to enter Daily Detail

3. Daily Detail
- Purpose: show one day’s balances, note, and expense list
- Include:
  - date header
  - actual balance
  - calculated balance
  - balance difference
  - note
  - list of expenses
  - button to add expense
- Expense list rows should show:
  - title
  - category
  - amount
  - payment method
  - optional memo
- This screen should feel structured and operational, like editing a daily ledger entry

4. Expense Create / Edit Form
- Purpose: quickly create or edit one expense
- Use a focused, compact form layout
- Include:
  - title
  - amount
  - category selector
  - memo
  - payment method
  - save button
  - delete button for edit mode
- Make number entry very prominent
- Show inline validation states for:
  - missing category
  - amount less than or equal to zero

5. Budget Settings
- Purpose: manage monthly base values
- Include:
  - start balance
  - monthly income
  - food budget
- This screen should be simple, structured, and editable
- Make it feel like editing key spreadsheet cells

6. Fixed Expense Management
- Purpose: manage recurring fixed expense rules
- Include a list of recurring expense rules
- Each row should include:
  - title
  - amount
  - billing day
  - active/inactive state
  - applied this month state
- Include:
  - create rule action
  - edit rule action
  - apply to current month action
- Show a warning state if a fixed expense rule would be duplicated in the same month

7. Monthly Report
- Purpose: help the user understand monthly result and spending composition
- Include:
  - monthly income
  - total expense
  - food expense total
  - fixed expense total
  - other expense total
  - saving amount
- Prefer number-first design
- Add simple chart support only if it helps readability:
  - small donut chart or horizontal bars for category distribution
- Do not make this look like a flashy analytics dashboard

Important product logic to reflect in the UI:
- Food budget is tracked separately from total expense
- Fixed expenses are recurring rules, not normal one-off expenses
- Saving amount = monthly income - total expense
- Actual balance and calculated balance can differ and must be visually distinguished
- Daily spending changes monthly summary values immediately

States to include in the design:
- normal state
- empty state
- overspent food budget state
- balance mismatch state
- loading or skeleton-like state
- inline validation state
- duplicated fixed expense warning state

Use mock data so the UI looks like it is already connected to APIs.
Use realistic Korean finance examples and KRW integer values.

Mock data references:

Home / Monthly Summary:
{
  "monthLabel": "2026년 5월",
  "monthlyIncome": 1217548,
  "totalExpense": 1065699,
  "saving": 151849,
  "foodBudget": 300000,
  "remainingFoodBudget": 42000,
  "hasBalanceDiff": true,
  "balanceDiff": 6000
}

Monthly Ledger:
{
  "monthLabel": "2026년 5월",
  "days": [
    {
      "date": "2026-05-01",
      "actualBalance": 350000,
      "calculatedBalance": 344000,
      "dailyExpenseTotal": 13500,
      "hasNote": true
    },
    {
      "date": "2026-05-02",
      "actualBalance": 362331,
      "calculatedBalance": 362331,
      "dailyExpenseTotal": 0,
      "hasNote": false
    },
    {
      "date": "2026-05-03",
      "actualBalance": 330211,
      "calculatedBalance": 330211,
      "dailyExpenseTotal": 18700,
      "hasNote": true
    }
  ]
}

Daily Detail:
{
  "date": "2026-05-01",
  "actualBalance": 350000,
  "calculatedBalance": 344000,
  "balanceDiff": 6000,
  "note": "점심 외식, 편의점, 버스 이동",
  "expenses": [
    {
      "id": 1001,
      "title": "점심",
      "category": "식비",
      "amount": 9000,
      "paymentMethod": "CARD",
      "memo": ""
    },
    {
      "id": 1002,
      "title": "편의점",
      "category": "기타",
      "amount": 4500,
      "paymentMethod": "CARD",
      "memo": "음료"
    }
  ]
}

Expense Form:
{
  "categories": ["식비", "고정", "기타"],
  "paymentMethods": ["CARD", "CASH", "TRANSFER"]
}

Budget Settings:
{
  "startBalance": 350000,
  "monthlyIncome": 1217548,
  "foodBudget": 300000
}

Fixed Expense Management:
{
  "items": [
    {
      "id": 1,
      "title": "관리비",
      "amount": 50000,
      "billingDay": 10,
      "isActive": true,
      "appliedThisMonth": true
    },
    {
      "id": 2,
      "title": "유튜브 프리미엄",
      "amount": 14900,
      "billingDay": 15,
      "isActive": true,
      "appliedThisMonth": false
    },
    {
      "id": 3,
      "title": "정기 교통비",
      "amount": 62000,
      "billingDay": 1,
      "isActive": false,
      "appliedThisMonth": false
    }
  ]
}

Monthly Report:
{
  "monthlyIncome": 1217548,
  "totalExpense": 1065699,
  "foodExpenseTotal": 310000,
  "fixedExpenseTotal": 516410,
  "otherExpenseTotal": 239289,
  "saving": 151849
}

Implementation expectation:
- Build the screens so they look production-ready
- Use reusable components and consistent spacing
- Make the data feel live and API-connected
- Name layers and sections clearly so this can later be converted into a real frontend
- Keep the result cohesive across all 7 screens
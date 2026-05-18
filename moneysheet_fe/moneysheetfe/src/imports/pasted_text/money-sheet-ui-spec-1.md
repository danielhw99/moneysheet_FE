Create a responsive web app UI for a personal finance product called “MoneySheet”.

This product helps a single user manage a monthly ledger, daily spending, food budget, fixed expenses, and monthly reports. The overall visual language should reinterpret Google Spreadsheet as a usable modern finance product. Do not make it look like a generic banking app. The design should be structured, grid-based, spreadsheet-like, and highly readable.

Core product goals:
- Let the user review the monthly ledger quickly
- Let the user move from monthly overview into a daily sheet by clicking a date
- Let the user record actual balance manually
- Let the user manage food budget and fixed expenses separately
- Let the user understand daily and monthly financial state through a spreadsheet-style interface

Platform:
- Responsive web app
- Primary design frame: desktop web first
- Also support mobile access with responsive layout
- Light mode only

Responsive requirements:
- Start with a desktop web frame layout
- Ensure all major screens can collapse cleanly to mobile
- Preserve spreadsheet clarity on smaller screens
- Important financial numbers and table relationships must remain readable on both desktop and mobile

Visual direction:
- Inspired by Google Spreadsheet
- Clean white workspace with subtle spreadsheet grid
- Structured cells, rows, columns, and clear borders
- Functional, practical, data-first interface
- Avoid overly soft card-heavy fintech style
- Less emotional lifestyle app, more personal financial workspace

Color direction:
- White base
- Very light gray sheet surfaces
- Soft gray borders and grid lines
- Spreadsheet-inspired green highlights
- Blue for linked or active states
- Red/orange for warnings or budget stress
- Neutral dark gray for labels and secondary text

Typography and hierarchy:
- Prioritize number readability
- Large bold values only for top summary numbers
- Dense but clean table text for ledger areas
- Clear distinction between labels and entered amounts

Navigation:
- Web global header
- Desktop navigation can use top navigation or left sidebar
- Mobile can use bottom navigation or compact drawer
- Include clear navigation between:
  - Landing
  - Login
  - Sign Up
  - Home / Monthly Summary
  - Monthly Ledger
  - Daily Sheet
  - Budget Settings
  - Fixed Expense Management
  - Monthly Report

Build reusable components:
- spreadsheet section blocks
- financial summary panels
- ledger cells
- input rows
- category rows
- status chips
- buttons
- responsive navigation

Create these screens:

1. Landing Page
- This is a web landing page introducing MoneySheet
- Purpose: explain the product and guide users to login or sign up
- Include:
  - product hero section
  - one-line value proposition
  - short explanation of monthly ledger, food budget, fixed expense, and report
  - CTA buttons for Login and Sign Up
  - preview section showing spreadsheet-style UI snippets
- Tone: practical and trustworthy, not overly flashy

2. Login Page
- Web login page
- Include:
  - ID field
  - password field
  - login button
  - sign up link
  - small helper text for mock login
- Use this mock credential:
  - id: test
  - password: test123
- Show this clearly in a subtle helper section so the prototype can be tested

3. Sign Up Page
- Include:
  - ID
  - password
  - password confirm
  - nickname or username
  - sign up button
- Keep structure simple and production-ready

4. Home / Monthly Summary
- Purpose: show the current monthly financial state at a glance
- Include:
  - current month label
  - monthly income
  - total expense
  - saving amount
  - food budget remaining
  - fixed expense status
  - CTA entry points to Monthly Ledger, Budget Settings, Fixed Expense Management, and Monthly Report
- This screen can use dashboard sections, but still should feel aligned with spreadsheet logic

5. Monthly Ledger
- Change the monthly ledger from a list/table view to a calendar-shaped ledger sheet
- The user must be able to review the monthly ledger through a full monthly calendar at once
- Each date cell should show lightweight financial status data, such as:
  - date
  - total used amount or daily summary
  - optional category or status hint
- Clicking a date must take the user into the Daily Sheet
- This should feel like a hybrid between a calendar and a ledger spreadsheet
- It should still preserve a structured sheet-like layout, not a playful calendar app style

6. Daily Sheet
- Do not label this screen with the generic title “일일상세”
- Instead, use the actual date itself as the screen title, such as:
  - 2026.05.01 Thu
  - or Korean date style equivalent
- Remove balance mismatch UI completely
- Actual balance is manually entered by the user, so leave that value blank or empty-state-ready in the initial mock
- Remove memo from this screen
- Redesign this screen based on the attached spreadsheet reference image
- The layout should strongly resemble a real spreadsheet sheet with bordered cells and structured rows
- Show these sections in the sheet:
  - date
  - account
  - calculated
  - margin
  - food budget status
  - special notes
  - usage amount list
  - daily total used amount
  - daily allocated food budget
  - fixed expense remaining
  - fixed expense used
- Use Korean labels similar to the spreadsheet style:
  - 날짜
  - 계좌
  - 계산
  - 여유
  - 식비현황 or 식비
  - 특이사항
  - 사용금액
  - 총사용금액
  - 금일편성식비
  - 고정지출 잔여
  - 고정지출 사용
- Add a “지출추가” button inside the sheet directly below the usage amount section
- The usage amount section should look like spreadsheet rows, where spending items and amounts are listed in cells
- Make this screen feel as close as possible to a real editable financial spreadsheet while still usable in a web product

7. Expense Create / Edit Form
- Purpose: create or edit one expense item from the Daily Sheet
- Include:
  - title
  - amount
  - category selector
  - memo or optional note for the expense item itself
  - payment method
  - save button
  - delete button for edit mode
- Make the form compact and practical
- This can open as a modal, side panel, or responsive sheet depending on screen size

8. Budget Settings
- Purpose: manage monthly financial base values
- Include:
  - start balance
  - monthly income
  - food budget
- Make it feel like editing important spreadsheet cells

9. Fixed Expense Management
- Purpose: manage recurring fixed expense rules
- Include a structured table/list of rules
- Each row should include:
  - title
  - amount
  - billing day
  - active/inactive state
  - applied this month state
- Include create, edit, and apply actions
- Keep this screen strongly table-driven

10. Monthly Report
- Purpose: show monthly financial result and spending composition
- Include:
  - monthly income
  - total expense
  - food expense total
  - fixed expense total
  - other expense total
  - saving amount
- Prefer number-first design
- Simple visual support such as bars or a small donut chart is allowed only if readability improves
- Keep it calm and practical

Important product logic to reflect in the UI:
- Food budget is tracked separately
- Fixed expenses are recurring rules
- Saving amount = monthly income - total expense
- Actual balance is user-entered data
- Daily entries affect monthly totals
- The daily sheet is the core operational screen and should look like a spreadsheet

States to include:
- normal state
- empty state
- responsive desktop state
- responsive mobile state
- overspent food budget state
- validation state
- duplicated fixed expense warning state
- loading/skeleton-like state

Use mock data so the UI feels like it is already connected to APIs.
Use realistic Korean finance examples and KRW integer values.

Mock login:
{
  "id": "test",
  "password": "test123"
}

Landing / Home Summary mock data:
{
  "monthLabel": "2026년 5월",
  "monthlyIncome": 1217548,
  "totalExpense": 1065699,
  "saving": 151849,
  "remainingFoodBudget": 42000,
  "fixedExpenseRemaining": 616940
}

Monthly Ledger calendar mock data:
{
  "monthLabel": "2026년 5월",
  "calendar": [
    { "date": "2026-05-01", "dailyExpenseTotal": 12100, "status": "used" },
    { "date": "2026-05-02", "dailyExpenseTotal": 0, "status": "empty" },
    { "date": "2026-05-03", "dailyExpenseTotal": 18700, "status": "used" },
    { "date": "2026-05-04", "dailyExpenseTotal": 5200, "status": "used" }
  ]
}

Daily Sheet mock data:
{
  "dateLabel": "2026.05.01 Thu",
  "account": "",
  "calculated": 132900,
  "margin": 2900,
  "foodStatus": 130000,
  "specialNotesRows": ["", "", "", ""],
  "usageItems": [
    { "title": "편도", "amount": 5600 },
    { "title": "지난주점심", "amount": 6500 }
  ],
  "dailyTotalUsed": 12100,
  "dailyAllocatedFoodBudget": 15000,
  "fixedExpenseRemaining": 616940,
  "fixedExpenseUsed": ""
}

Expense Form mock data:
{
  "categories": ["식비", "고정", "기타"],
  "paymentMethods": ["CARD", "CASH", "TRANSFER"]
}

Budget Settings mock data:
{
  "startBalance": 350000,
  "monthlyIncome": 1217548,
  "foodBudget": 300000
}

Fixed Expense Management mock data:
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
    }
  ]
}

Monthly Report mock data:
{
  "monthlyIncome": 1217548,
  "totalExpense": 1065699,
  "foodExpenseTotal": 310000,
  "fixedExpenseTotal": 516410,
  "otherExpenseTotal": 239289,
  "saving": 151849
}

Implementation expectations:
- Make the product feel coherent across all screens
- Name sections and layers clearly
- Use reusable components
- Make the daily sheet the most spreadsheet-faithful screen
- Preserve usability while strongly reflecting spreadsheet structure
- Ensure the output looks like a web product that can later connect to real APIs
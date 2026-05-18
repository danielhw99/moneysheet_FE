Create a responsive web app UI for a personal finance product called “MoneySheet”.

This product helps a single user manage a monthly ledger, daily spending, food budget, fixed expenses, monthly income records, and monthly reports. The visual language should reinterpret Google Spreadsheet as a usable modern finance product. Do not make it look like a generic banking app. The UI should be structured, spreadsheet-like, grid-based, and practical.

Core product goals:
- Let the user use the ledger as the main home experience
- Let the user review a full monthly calendar ledger at once
- Let the user move from the monthly calendar into a daily spreadsheet sheet
- Let the user manage fixed expenses, food budget, and monthly income in spreadsheet-like sections
- Let the user understand monthly budget and spending through structured tables

Platform:
- Responsive web app
- Desktop web first
- Mobile accessible through responsive layout
- Light mode only

Responsive requirements:
- Design with a desktop web frame first
- Adapt cleanly to tablet and mobile
- Preserve spreadsheet readability on smaller screens
- Keep table logic understandable even when sections stack on mobile

Visual direction:
- Inspired by Google Spreadsheet
- White sheet background
- Clear borders and grid lines
- Dense but readable tabular layout
- Minimal decorative UI
- Avoid overly card-heavy fintech dashboard style
- Prefer spreadsheet sections, boxes, tables, and structured summary blocks

Color direction:
- White base
- Light gray sheet surfaces
- Soft gray borders
- Spreadsheet green for positive totals
- Warm yellow or beige for section headers
- Red for negative totals, warnings, or overspending
- Blue only where interaction emphasis is needed

Typography:
- Prioritize readability of Korean labels and KRW numbers
- Large emphasis only for key monthly totals
- Use compact table text for ledger and budget areas
- Make totals very easy to scan

Navigation:
- Web global header
- Desktop navigation can use top navigation or left sidebar
- Mobile can use compact navigation
- Main screens:
  - Landing
  - Login
  - Sign Up
  - Home = Monthly Ledger
  - Daily Sheet
  - Budget Settings
  - Fixed Expense Management
  - Monthly Report

Important structural correction:
- Remove the previous Home summary dashboard concept
- Set Home directly as the Monthly Ledger page
- The user should land on the ledger immediately after login

Build reusable components:
- spreadsheet tables
- date cells
- budget tables
- fixed expense rows
- income rows
- section headers
- total amount blocks
- input fields
- action buttons

Create these screens:

1. Landing Page
- Web landing page
- Introduce MoneySheet as a personal ledger and budget management tool
- Include:
  - product hero
  - short explanation of monthly ledger, daily sheet, budget table, fixed expense, and report
  - CTA buttons for Login and Sign Up
  - preview visuals that hint at spreadsheet-style finance management
- Tone should feel practical and trustworthy

2. Login Page
- Web login page
- Include:
  - ID field
  - password field
  - login button
  - sign up link
  - helper text for mock login credentials
- Use this mock login:
  - id: test
  - password: test123

3. Sign Up Page
- Include:
  - ID
  - password
  - password confirm
  - nickname or username
  - sign up button
- Keep the layout simple and production-ready

4. Home / Monthly Ledger
- This is the main home screen after login
- Do not create a separate home summary dashboard
- The home screen must be the monthly ledger itself

- Monthly Ledger requirements:
  - Use a normal full monthly calendar layout
  - The calendar must show a realistic complete month layout, not a broken or partial calendar ending around day 18
  - The user should be able to see the entire month at once
  - Clicking any date cell should open the Daily Sheet
  - Keep the UI minimal inside each date cell
  - Remove large or noisy “지출” labels from the calendar UI
  - Use subtle daily indicators only, such as small amount, status marker, or minimal summary
  - The overall calendar should feel like a clean ledger calendar sheet

- At the bottom of the Monthly Ledger page, attach a spreadsheet-style budget information table inspired by the provided reference image
- This lower section should look like a real monthly summary/budget sheet and include multiple adjacent spreadsheet blocks

- Include these lower budget table sections:
  - fixed expense table
  - food budget table
  - other expense table
  - base spending total block
  - other spending total block
  - total spending block
  - monthly income record table
  - actual saving amount block
  - remarks / note block

- The lower table should visually resemble the attached spreadsheet reference:
  - multiple side-by-side table groups
  - clear spreadsheet borders
  - colored total cells
  - green and red total emphasis
  - yellow header cells
  - strong “sheet” feeling

5. Daily Sheet
- Do not title this screen as “일일상세”
- Title the screen only using the actual date, such as:
  - 2026.05.01 Thu
  - or a Korean date style equivalent
- Remove balance mismatch UI
- Actual balance is manually entered by the user, so keep the actual balance cell blank or empty-state-ready in the mock
- Remove memo field as a standalone UI block
- Redesign this screen to closely match a spreadsheet sheet
- The Daily Sheet should display:
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
- Put a “지출추가” button directly below the 사용금액 section
- Make this screen one of the most spreadsheet-faithful screens in the whole product

6. Expense Create / Edit Form
- Used from the Daily Sheet
- Include:
  - title
  - amount
  - category
  - payment method
  - optional expense note
  - save button
  - delete button in edit mode
- Keep it compact and practical
- It can appear as modal, side panel, or responsive sheet

7. Budget Settings
- Redesign this page based on the new requirement
- Remove initial balance input entirely
- Monthly income should be handled as a list, not a single field
- The user should be able to add multiple monthly income records
- Each income row can include:
  - date
  - label/source
  - amount
- Food budget should not be a single input
- Instead, split food budget inputs into:
  - weekday budget
  - saturday budget
  - sunday budget
- The page should feel like a spreadsheet-based editable settings table

8. Fixed Expense Management
- Show recurring fixed expense rules in a table-driven layout
- Each row should include:
  - title
  - amount
  - billing day
  - active/inactive state
  - applied this month state
- Include actions for create, edit, and apply
- Keep the UI strongly table-based

9. Monthly Report
- Show monthly financial result and spending composition
- Include:
  - monthly income total
  - total expense
  - fixed expense total
  - food expense total
  - other expense total
  - actual saving amount
- Prefer numbers first, charts second
- Use simple chart support only if useful
- Keep it practical and consistent with spreadsheet logic

Important product logic:
- Home is the Monthly Ledger
- Monthly Ledger uses a full calendar sheet
- Daily Sheet is opened by clicking a date in the calendar
- Food budget is split by weekday, saturday, sunday
- Monthly income is stored as a list of records
- Fixed expenses are recurring rules
- Actual balance is user-entered
- Actual saving amount and totals should be displayed clearly in spreadsheet-like summary blocks

States to include:
- normal state
- empty state
- responsive desktop state
- responsive mobile state
- overspent budget state
- validation state
- duplicated fixed expense warning state
- loading/skeleton state

Use mock data so the UI feels API-connected.
Use realistic Korean finance examples and KRW integer values.

Mock login:
{
  "id": "test",
  "password": "test123"
}

Monthly Ledger calendar mock data:
{
  "monthLabel": "2026년 5월",
  "calendar": [
    { "date": "2026-05-01", "dailyExpenseTotal": 12100, "status": "used" },
    { "date": "2026-05-02", "dailyExpenseTotal": 0, "status": "empty" },
    { "date": "2026-05-03", "dailyExpenseTotal": 18700, "status": "used" },
    { "date": "2026-05-04", "dailyExpenseTotal": 5200, "status": "used" },
    { "date": "2026-05-05", "dailyExpenseTotal": 0, "status": "empty" },
    { "date": "2026-05-06", "dailyExpenseTotal": 3000, "status": "used" },
    { "date": "2026-05-07", "dailyExpenseTotal": 0, "status": "empty" },
    { "date": "2026-05-08", "dailyExpenseTotal": 14500, "status": "used" },
    { "date": "2026-05-09", "dailyExpenseTotal": 0, "status": "empty" },
    { "date": "2026-05-10", "dailyExpenseTotal": 8900, "status": "used" }
  ]
}

Monthly Ledger bottom budget sheet mock data:
{
  "fixedExpenseTable": [
    { "title": "관리비", "amount": 100000 },
    { "title": "교통", "amount": 150000 },
    { "title": "건강", "amount": 21940 },
    { "title": "헤어", "amount": 35000 },
    { "title": "통신", "amount": 19000 }
  ],
  "fixedExpenseTotal": 616940,
  "foodBudgetTable": {
    "weekdayCount": 21,
    "saturdayCount": 5,
    "sundayCount": 5,
    "weekdayBudget": 15000,
    "saturdayBudget": 5000,
    "sundayBudget": 15000,
    "total": 415000
  },
  "otherExpenseTable": [
    { "date": "26.05.11", "title": "4월 서초값", "amount": 40000 },
    { "date": "26.05.13", "title": "캡더선물", "amount": 19800 },
    { "date": "25.05.14", "title": "뮤지컬", "amount": 56250 }
  ],
  "otherExpenseTotal": 145509,
  "baseSpendingTotal": 1031940,
  "totalExpense": 1177449,
  "incomeRecords": [
    { "date": "26.05.01", "title": "용돈", "amount": 570000 },
    { "date": "26.05.18", "title": "국취제", "amount": 600000 }
  ],
  "incomeTotal": 1170000,
  "actualSavingAmount": -7449,
  "remarks": [
    { "title": "목양비잔액", "amount": 30000 }
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
  "monthlyIncomeRecords": [
    { "date": "2026-05-01", "label": "용돈", "amount": 570000 },
    { "date": "2026-05-18", "label": "국취제", "amount": 600000 }
  ],
  "foodBudget": {
    "weekday": 15000,
    "saturday": 5000,
    "sunday": 15000
  }
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
  "incomeTotal": 1170000,
  "totalExpense": 1177449,
  "fixedExpenseTotal": 616940,
  "foodExpenseTotal": 415000,
  "otherExpenseTotal": 145509,
  "actualSavingAmount": -7449
}

Implementation expectations:
- Make the entire product cohesive
- Use reusable components
- Keep the Monthly Ledger as the main home screen
- Make the monthly calendar correct and complete
- Keep the calendar UI minimal
- Make the lower budget sheet highly spreadsheet-like
- Make the Daily Sheet the most faithful spreadsheet-style screen
- Ensure the output looks ready to connect to real APIs later
import { httpClient, type HttpClient } from '../../api/httpClient'
import { createAuthApi } from '../../features/auth/authApi'
import { createSummaryApi } from '../summaryApi'
import { createRecordApi } from '../recordApi'
import { createBudgetApi } from '../budgetApi'
import type { MoneySheetDataAccess } from '../MoneySheetDataAccess'

export function createHttpDataAccess(client: HttpClient = httpClient): MoneySheetDataAccess {
  return {
    ...createBudgetApi(client),
    getProfile: () => createAuthApi(client).me(),
    ...createRecordApi(client),
    ...createSummaryApi(client),
  }
}

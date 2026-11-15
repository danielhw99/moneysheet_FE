import { ApiError, httpClient, type HttpClient } from '../../api/httpClient'
import { createAuthApi } from '../../features/auth/authApi'
import { createRecordApi } from '../recordApi'
import { createBudgetApi } from '../budgetApi'
import type { MoneySheetDataAccess } from '../MoneySheetDataAccess'

export function createHttpDataAccess(client: HttpClient = httpClient): MoneySheetDataAccess {
  const unavailable = async (): Promise<never> => { throw new ApiError(501, 'NOT_IMPLEMENTED', '이 기능의 서버 연결은 준비 중이에요. 예산 관리에서 설정을 확인해 주세요.') }
  return {
    ...createBudgetApi(client),
    getProfile: () => createAuthApi(client).me(),
    ...createRecordApi(client),
    getDaily: unavailable, getMonthly: unavailable, getHome: unavailable,
  }
}

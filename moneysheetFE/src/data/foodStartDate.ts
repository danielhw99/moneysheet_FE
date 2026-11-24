import { ApiError } from '../api/httpClient'
import { validDate } from '../utils/date'
export function readFoodStartDate(value:unknown,month:string):string {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!validDate(value)||value.slice(0,7)!==month)throw new ApiError(0,'PROTOCOL','서버 식비 시작일을 확인하지 못했어요.')
 return value
}

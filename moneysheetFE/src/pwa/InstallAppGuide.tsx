import type { RefObject } from 'react'
import FeedbackDialog from '../components/FeedbackDialog'

export default function InstallAppGuide({ open, onClose, triggerRef }: {
 open: boolean; onClose: () => void; triggerRef: RefObject<HTMLButtonElement | null>
}) {
 return <FeedbackDialog open={open} mode="alert" title="홈 화면에 MoneySheet 추가"
   description={[
    'Android · Chrome\n브라우저 우측 상단 ⋮ 메뉴에서 “홈 화면에 추가” 또는 “앱 설치”를 선택해 주세요.',
    'iPhone · Safari\n공유 버튼 → “홈 화면에 추가”를 선택해 주세요. “웹 앱으로 열기” 옵션이 보이면 켜 주세요.',
    '추가한 MoneySheet 아이콘으로 열면 주소창 없는 앱 창으로 사용할 수 있어요. 설치 메뉴와 실행 방식은 기기·브라우저 버전에 따라 다를 수 있어요.',
    '조회·저장에는 온라인 연결이 필요해요. 설치 후 로그인 상태가 이어지지 않으면 다시 로그인하고 “로그인 유지”를 선택해 주세요.',
   ].join('\n\n')}
   onClose={onClose} fallbackFocusRef={triggerRef} />
}

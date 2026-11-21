## 카테고리 관리 — UR07 (#41)

- 앱 설정 → 카테고리 관리에서 고정비/내역 관리 화면으로 이동합니다. 내역 화면 안에 지출/입금 탭을 두고 기존 입력 화면의 즉시 추가는 유지합니다.
- 이름 수정·취소·삭제를 지원합니다. 중복409 오류 시 작성한 입력은 유지하고, 삭제 확인은 “해당 카테고리가 삭제됩니다”로 표시합니다. 삭제한 카테고리의 예산·거래는 미분류가 됩니다.
- 고정비 카테고리는 선택 사항입니다. 초기 예산 완료·신규/편집·HTTP 응답에서 categoryId=null을 처리합니다. Main·여유비 계산식은 바꾸지 않습니다.
- BE #39의 PATCH/DELETE 및 V5와 함께 준비합니다. 실제 DB 전환은 별도 확인하며 HTTP 실패를 mock 성공으로 대체하지 않습니다.
- 앱 루트에서 `pnpm test`, `pnpm typecheck`, `pnpm build`를 실행합니다. 화면 검증과 HTTP 응답 대역 테스트를 실제 BE/DB 종단 검증과 구분합니다.

## 📜 Convention

### Commit Convention

---

<details>
<summary style="font-size:1.3em;">Rules</summary>
<div markdown="1">

### 1. Git Flow

작업 순서는 다음과 같습니다.

1. GitHub issue를 생성하고 assignee, milestone, label, project를 설정합니다.
2. 최신 `dev` branch에서 작업 유형에 맞는 branch를 생성합니다.
3. 작업 및 필요한 검증을 수행합니다.
4. add → commit → push → pull request 순서로 진행합니다.
5. self review와 CodeRabbit 리뷰를 확인하고 필요한 수정을 반영합니다.
6. pull request를 `dev` branch로 squash merge 합니다.
7. 완료된 issue와 pull request를 정리하고 작업 branch를 삭제합니다.
8. 다음 작업은 최신 `dev` branch에서 새로운 branch를 생성합니다.

진행 중인 다른 작업에 `dev`의 변경이 필요한 경우 해당 변경을 작업 branch에 반영합니다.

### 2. Etc

- `dev` branch에서 직접 작업하는 것은 원칙적으로 금지합니다. 단, README 작성은 `dev` branch에서 수행합니다.
- `dev`, `main` branch로 merge할 때에는 pull request를 생성합니다.
- 변경 내용에 필요한 검증을 수행하고 실제 확인 결과를 기록합니다.
- merge된 작업 branch를 다른 issue에 재사용하지 않습니다.
- 서로 관련된 변경은 함께 검토·검증할 수 있는 범위에서 하나의 pull request로 묶을 수 있습니다.

</div>
</details>

<details>
<summary style="font-size:1.3em;">Branch</summary>
<div markdown="1">

### 1. Branch

branch는 issue를 기반으로 작업 단위 또는 기능 단위로 생성합니다.

도메인이 같더라도 다른 작업이라면 별도 branch를 생성합니다.

### 2. Branch Naming Rule

branch를 생성하기 전에 issue를 먼저 작성합니다.

생성된 issue 번호와 domain 명을 조합하여 다음 형식을 사용합니다.

```text
<Prefix>/<Issue_Number>-<Domain>
```

- Prefix와 Domain은 소문자를 사용합니다.
- 여러 단어로 구성된 Domain은 하이픈(`-`)으로 구분합니다.
- release branch는 예외적으로 `release/<버전>` 형식을 사용합니다.

### 3. 기준 Branch

| Branch | 설명 |
| --- | --- |
| `main` | 개발이 완료된 배포 대상 산출물을 관리합니다. |
| `dev` | 작업 branch의 변경 사항을 통합합니다. 일반 작업 PR의 대상 branch입니다. |

### 4. 작업 Branch Prefix

| Prefix | 형식 | 설명 | 예시 |
| --- | --- | --- | --- |
| `feature` | `feature/<Issue_Number>-<Domain>` | 새로운 기능 개발 | `feature/7-auth` |
| `bugfix` | `bugfix/<Issue_Number>-<Domain>` | 버그 수정 | `bugfix/3-budget` |
| `hotfix` | `hotfix/<Issue_Number>-<Domain>` | 긴급 버그 수정 | `hotfix/15-auth` |
| `release` | `release/<버전>` | 배포 준비 | `release/v1.0.0` |
| `chore` | `chore/<Issue_Number>-<Domain>` | 설정 및 유지보수 | `chore/5-repository` |
| `docs` | `docs/<Issue_Number>-<Domain>` | 문서 작업 | `docs/8-convention` |
| `style` | `style/<Issue_Number>-<Domain>` | 코드 스타일 변경 | `style/9-format` |
| `refactor` | `refactor/<Issue_Number>-<Domain>` | 코드 구조 개선 | `refactor/10-budget` |

### 5. Branch와 Commit Prefix 구분

branch Prefix와 commit·PR Prefix는 구분합니다.

- `feature` branch → `[feat]`
- `bugfix`, `hotfix` branch → `[fix]`
- 나머지는 실제 변경 내용에 맞는 commit Prefix를 사용합니다.

예시:

```text
Branch: bugfix/3-budget
Commit: [fix] #3 고정지출 예산 입력 화면 연결
PR:     [fix] #3 고정지출 예산 입력 화면 연결
```

</div>
</details>

<details>
<summary style="font-size:1.3em;">Issue</summary>
<div markdown="1">

### 1. Issue

작업 시작 전 GitHub issue를 생성합니다.

issue는 작업 단위 또는 기능 단위로 생성하며, 생성 후 표시되는 issue number를 branch 이름과 commit message에 사용합니다.

issue 제목에는 작업의 대표적인 설명을 적고, 내용에는 배경·목적·작업 목록·검증 계획·완료 조건을 작성합니다.

issue 생성 시 다음 항목을 설정합니다.

- Assignee: 작업 담당자
- Label: 작업 유형 및 우선순위
- Milestone: 해당 작업의 목표 일정
- Project: 작업을 관리하는 프로젝트

이슈 폼의 작업 유형 선택과 실제 GitHub label 부착은 별도로 확인합니다.

### 2. Issue Naming Rule

```text
[<Prefix>] <Description>
```

Prefix는 commit message convention을 따릅니다.

### 3. Examples

```text
[feat] 월 식비 예산 설정 기능 구현
[fix] 고정지출 예산 입력 화면 연결
[chore] CodeRabbit 리뷰 설정
[docs] 프로젝트 컨벤션 정리
```

</div>
</details>

<details>
<summary style="font-size:1.3em;">Commit</summary>
<div markdown="1">

### 1. Commit Message Convention

다음 형식을 준수합니다.

```text
[<Prefix>] #<Issue_Number> <Description>
```

- **feat**: 새로운 기능 구현  
  `[feat] #11 구글 로그인 API 기능 구현`
- **fix**: 코드 오류 수정  
  `[fix] #10 회원가입 비즈니스 로직 오류 수정`
- **del**: 쓸모없는 코드 삭제  
  `[del] #12 불필요한 import 제거`
- **docs**: README나 wiki 등의 문서 개정  
  `[docs] #14 리드미 수정`
- **refactor**: 내부 로직은 변경하지 않고 기존 코드를 개선하는 리팩터링  
  `[refactor] #15 코드 로직 개선`
- **chore**: 의존성 추가, yml 추가와 수정, 패키지 구조 변경, 파일 이동  
  `[chore] #21 yml 수정`  
  `[chore] #22 lombok 의존성 추가`
- **test**: 테스트 코드 작성 및 수정  
  `[test] #20 로그인 API 테스트 코드 작성`
- **style**: 코드 동작에 영향을 주지 않는 주석, 포맷, 줄바꿈 변경  
  `[style] #23 코드 포맷 정리`

</div>
</details>

<details>
<summary style="font-size:1.3em;">Pull Request</summary>
<div markdown="1">

### 1. Pull Request

`dev`, `main` branch로 merge할 때에는 pull request가 필요합니다.

일반 작업 branch의 PR 대상은 `dev`이며, squash merge 합니다.

### 2. Pull Request Naming Rule

```text
[<Prefix>] #<Issue_Number> <Description>
```

Prefix는 commit message convention을 따릅니다.

### 3. 작성 내용

저장소의 PR template을 사용하여 다음 내용을 작성합니다.

- 변경 내용과 목적
- 관련 issue
- 실제 수행한 검증 방법과 결과
- UI 변경 시 스크린샷 및 모바일 확인 결과
- 미확인 사항이 있다면 그 내용과 이유

### 4. Review

- PR 생성 전 변경 파일을 직접 검토합니다.
- CodeRabbit 리뷰를 확인하고 유효한 지적을 반영합니다.
- UI 변경이 없는 설정·문서 PR은 화면 검증 대신 해당 변경에 필요한 검증을 기록합니다.
- 관련 없는 변경을 하나의 PR에 섞지 않습니다.

### 5. Examples

```text
[fix] #3 고정지출 예산 입력 화면 연결
[chore] #5 CodeRabbit 리뷰 설정
```

</div>
</details>

<br>

### Code Convention

---

<details>
<summary style="font-size:1.3em;">Naming</summary>
<div markdown="1">

- 패키지 : 언더스코어(`_`)나 대문자를 섞지 않고 소문자를 사용하여 작성합니다.
- 클래스 : 클래스 이름은 명사나 명사절로 지으며, 대문자 카멜표기법(Upper camel case)을 사용합니다.
- 메서드 : 메서드 이름은 동사/전치사로 시작하며, 소문자 카멜표기법(Lower camel case)를 사용합니다. 의도가 전달되도록 최대한 간결하게 표현합니다.
- 변수 : 소문자 카멜표기법(Lower camel case)를 사용합니다.
- ENUM, 상수 : 상태를 가지지 않는 자료형이면서 `static final`로 선언되어 있는 필드일 때를 상수로 간주하며, 대문자와 언더스코어(Upper_snake_case)로 구성합니다.
- DB 테이블: 소문자와 언더스코어로(lower_snake_case) 구성합니다.
- 컬렉션(Collection): **복수형**을 사용하거나 **컬렉션을 명시합니다**. (Ex. userList, users, userMap)
- LocalDateTime: 접미사에 **Date**를 붙입니다.

</div>
</details>

<details>
<summary style="font-size:1.3em;">Comment</summary>
<div markdown="1">

### 1. 한줄 주석은 // 를 사용한다.

```java
// 하이~
```

### 2. Bracket 사용 시 내부에 주석을 작성한다.

```java
/*
   하이~!
*/
```

### 3. 주요 함수에 대한 주석

```java
/*
 * 입력 : 인덱스:Long
 * 기능 : 유저 인덱스로 db에 접근해 유저 객체를 반환한다
 * 출력 : 유저:User
 */
public User getUser(Long idx)
```

</div>
</details>

<details>
<summary style="font-size:1.3em;">Import</summary>
<div markdown="1">

### 1. 소스파일당 1개의 탑레벨 클래스를 담기

> 탑레벨 클래스(Top level class)는 소스 파일에 1개만 존재해야 한다. (탑레벨 클래스 선언의 컴파일타임 에러 체크에 대해서는 Java Language Specification 7.6 참조)

### 2. static import에만 와일드 카드 허용

> 클래스를 import할 때는 와일드카드(`*`) 없이 모든 클래스명을 다 쓴다. static import에서는 와일드카드를 허용한다.

### 3. 애너테이션 선언 후 새줄 사용

> 클래스, 인터페이스, 메서드, 생성자에 붙는 애너테이션은 선언 후 새줄을 사용한다. 이 위치에서도 파라미터가 없는 애너테이션 1개는 같은 줄에 선언할 수 있다.

### 4. 배열에서 대괄호는 타입 뒤에 선언

> 배열 선언에 오는 대괄호(`[]`)는 타입의 바로 뒤에 붙인다. 변수명 뒤에 붙이지 않는다.

### 5. `long`형 값의 마지막에 `L`붙이기

> long형의 숫자에는 마지막에 대문자 'L'을 붙인다. 소문자 'l'보다 숫자 '1'과의 차이가 커서 가독성이 높아진다.

</div>
</details>

<details>
<summary style="font-size:1.3em;">URL</summary>
<div markdown="1">

### URL

URL은 RESTful API 설계 가이드에 따라 작성합니다.

- HTTP Method로 구분할 수 있는 get, put 등의 행위는 URL에 표현하지 않습니다.
- 마지막에 `/`를 포함하지 않습니다.
- `_` 대신 `-`를 사용합니다.
- 소문자를 사용합니다.
- 확장자는 포함하지 않습니다.

</div>
</details>


## 실제 인증 연동 — FE #17 (2026-11-13)

- 회원가입·로그인·로그아웃·현재 사용자 조회는 실제 BE API를 호출합니다. 로그인 우회/테스트 계정 자동 입력은 제거했습니다.
- 실행 환경: Node22(.mise.toml), pnpm10.34.3. `moneysheetFE/`에서 실행합니다.
```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
pnpm dev --host 127.0.0.1
```
- 기본 FE 주소 http://127.0.0.1:8443 . `/api`를 http://127.0.0.1:8080 의 local BE로 프록시합니다. BE의 MySQL SSH 터널도 필요합니다. Vite 프록시는 개발용이며 운영은 Caddy 등 동일 출처 `/api` 라우팅이 필요합니다.
- 별도 CORS 허용/토큰 저장은 사용하지 않습니다. 브라우저가 HttpOnly 세션 쿠키를 관리하며 CSRF 토큰은 메모리에만 유지합니다. 비밀번호는 변환하거나 localStorage/sessionStorage에 저장하지 않습니다.
- 가입 비밀번호는15~128 Unicode 코드포인트, 로그인은 기존 정책을 소급하지 않고128 상한. 개인정보처리방침 버전은 BE 기본값 `v1`과 일치해야 합니다. 이메일 인증/비밀번호 찾기는 아직 미지원입니다.
- 새로고침은 `/me`로 세션을 복원합니다. 포커스/탭 복귀 시 확인하며 백그라운드 폴링으로 유휴 시간을 연장하지 않습니다. 이전 응답과 이전 세션의401이 새 사용자 상태를 덮어쓰지 않도록 구분합니다.
- 401은 보호 화면과 사용자 상태를 제거합니다. 403 CSRF_INVALID는 토큰을 재취득하되 저장 요청을 자동 재전송하지 않습니다. 입력을 보존하고 사용자 재시도를 안내합니다. 429는 Retry-After 초를 표시합니다. 네트워크 실패를 mock 로그인 성공으로 바꾸지 않습니다.
- 업무 예산/내역/메모 API는 아직 연결 전입니다. 개발 모드에서만 예시 표시와 함께 별도 메모리 인스턴스를 사용하며 로그인 세션·사용자 변경·로그아웃·새로고침 때 초기화합니다. 같은 사용자의 정상 포커스 확인은 인스턴스를 유지합니다.
- 프로덕션 빌드는 실제 인증/프로필/로그아웃 및 준비 안내만 제공하고 업무 mock을 생성하지 않습니다. 계정 수정/비밀번호 변경 버튼은 후속 API 전까지 비활성화합니다.
- 소스 위치: `src/api/httpClient.ts`, `src/features/auth/authApi.ts`, `AuthProvider.tsx`, `AuthScreen.tsx`. 기존 업무 데이터 계약은 별도 유지합니다.
- 테스트: Vitest·React Testing Library. Windows 빠른 테스트23개 통과. 실제 Chrome/BE/MySQL 연동10개 시나리오 및390px 화면 확인. 프로덕션 번들 실제 브라우저 확인 결과는 PR에 기록합니다.
- `.github/workflows/frontend-ci.yml`: dev/main PR과 dev push에서 잠금 의존성 설치→테스트→타입 검사→빌드. 자동 배포·병합은 하지 않습니다. 필수 검사 지정은 별도 저장소 설정입니다.
- BE 검토: 인증 API·쿠키·CSRF 계약 및 실제 흐름에서 수정 필요 결함이 재현되지 않아 BE 코드/이슈/PR 변경은 만들지 않았습니다. FE CI는 실제 개발 DB/SSH/비밀값을 사용하지 않습니다.


### #17 실제 검증 결과

- Node22.23.5 / pnpm10.34.3: frozen-lockfile 설치·Vitest23개·타입 검사·프로덕션 빌드 성공.
- 실제 Chrome 개발 화면: 가입/중복409/CSRF403 갱신과 수동 재시도/비밀번호401/Unicode·공백 보존 로그인/쿠키/새로고침/계정 읽기 전용/서버 로그아웃 감지/사용자 전환/모바일·웹 저장소 확인 등10개 시나리오 통과.
- 실제 프로덕션 번들: 가입·로그인·본인 프로필·로그아웃 정상, 업무 mock UI 미노출 및390px 가로 넘침 없음 확인.
- 검증 계정3개는 id+검증 이메일 일치 조건으로만 삭제 확인. 기존 사용자와 업무 데이터를 삭제하지 않았으며 검증 비밀번호·CSRF·세션 토큰을 파일에 저장하지 않음.
- 로그인·실제 프로필·모바일·프로덕션 화면 캡처는 로컬 검증 산출물로 보관. GitHub 첨부로 게시하지 않음.
- CI 결과는 PR 생성 후 실제 체크 상태로 확인하며, 운영 HTTPS/Caddy·모든 업무 API 연동 완료를 의미하지 않음.
## 저장 재시도 요청 키 — 이슈 #43

- 내역·메모·고정비 지급·Monthly 기록·고정비 항목 추가의 신규 생성은 `Idempotency-Key`를 전달합니다. 실패 후 같은 폼의 같은 입력을 재시도하면 같은 키를 쓰고, 실제 입력 변경/성공/취소 뒤 별도 작성은 새 키로 분리합니다. 금액의 표시 쉼표는 숫자로 정규화한 후 비교합니다.
- 키는 API JSON 본문과 분리한 헤더 옵션입니다. 기존 수정/삭제·자동 재전송 금지·실패 입력 보존·로그아웃 시 사용자 작업 공간 정리를 유지합니다. 키 수명은 현재 폼에 한정되며 새로고침/폼 폐기 후 입력 복구 기능을 추가하지 않습니다.
- 실제 중복 방지는 BE #41의 트랜잭션/DB 이력이 담당합니다. 내부 mock은 UI 테스트용이며 DB 중복 방지의 근거로 사용하지 않습니다. BE V6 및 대응 버전을 함께 준비해야 합니다. 실제 개발 DB 적용은 별도 절차입니다.
# UR08 이메일 인증 구현 브랜치

신규 가입은 이메일 인증번호 발송·확인 후 가입합니다. 기존 계정은 BE V7에서 일회성 인증 완료 처리합니다. 이메일을 바꾸면 이전 인증 결과를 폐기하며 실패 입력은 유지합니다. SMTP 발신 주소는 moneysheet.site@gmail.com입니다. 실제 SMTP 수신 확인·기존 DB V7 적용은 별도이며 비밀번호 찾기는 포함하지 않습니다.

## Daily 입력 흐름 — FE47

- Daily의 항목/추가 버튼은 편집/신규 작성으로 바로 연결하고 헤더는 목록으로 이동합니다. 일반 저장·취소·삭제 후 진입한 Daily 날짜 또는 목록으로 돌아갑니다.
- 내역의 `저장 및 계속 이어쓰기`는 날짜·방향·카테고리를 유지하고 내용·금액을 비운 새 기록을 엽니다. 시간은 현재 시각으로 갱신합니다. 편집 다음에는 새 POST를 사용하고 실패 재시도 키는 유지합니다.
- 한글 조합 중 Enter의 조기 저장을 막고 텍스트 입력 힌트를 지정합니다. 브라우저/OS의 한영 전환을 강제하지 않습니다. 메모·고정지출·Monthly 이어쓰기는 제외합니다.


## 식비 설정 (#51)
- 앱 설정 → 식비 설정에서 사용 여부·일괄/3회 지급을 변경합니다. OFF여도 토글/진입은 가능하며 하위 설정만 비활성화합니다.
- 최초 예산 준비에서 기능 설명 후 사용 여부를 선택합니다. OFF는 식비 입력 없이 시작하고 ON은 주중·토·일 금액을 저장해야 적용됩니다.
- 저장 전 선택·입력은 계산에 적용하지 않습니다. 이번 달 전체 재계산 안내와 오류/입력 보존을 제공하며 OFF 업무 화면에서는 식비 영역을 숨깁니다.
- BE #45 및 V8 적용이 필요합니다. 전체 튜토리얼/모션 리뉴얼은 포함하지 않습니다.

## 공통 화면 정리 (#53)
- Daily 실제 계좌 잔액은 조회 전부터 입력칸·잠금·도움말을 유지하고 입력칸 placeholder로만 로딩을 표시합니다. 조회·저장 중 조작을 막고 미저장 값/날짜별 상태를 보존합니다.
- 내역·메모·고정지출 지급·수입·그 외 지출은 목록 내부에서 조회 상태·오류·재시도를 표시합니다. 작성/편집의 기존 조회 경로는 유지합니다.
- 예산 잠금은 월 표시 줄에서 아이콘+상태를 하나의 버튼으로 표시합니다. 지난 월 조회 전용 규칙은 그대로입니다.
- 닉네임 저장 간격과 메모 행의 수입 빨강/지출 파랑을 적용합니다. 계산·저장·API·DB 변경은 없습니다.

## 홈 날짜 선택·빠른 작성 (#55)
- 날짜 첫 클릭/터치는 선택만 하고 홈에 머뭅니다. 같은 날짜를 다시 누르면 해당 Daily로 이동합니다. 시간 제한이 있는 더블클릭이 아니며, 초기 선택 날짜와 월 이동 후에도 첫 클릭은 선택만 합니다.
- 홈 우측 하단 `+`에서 선택 날짜의 내역·메모·고정지출 지급을 목록을 거치지 않고 작성할 수 있습니다. 고정지출 메뉴는 예산 항목 추가가 아닌 지급 기록 작성입니다.
- 메뉴에 작성 날짜를 표시하고 날짜/화면 변경·바깥 클릭·Escape 시 닫습니다. 조회 중·조회 실패·저장 중에는 빠른 작성을 제한하고 기존 재시도 및 예산 준비 흐름을 유지합니다.
- 작성 후 저장·취소는 기존 직접 작성 흐름대로 선택 날짜의 Daily로 돌아갑니다. 금액 계산·API·DB 계약은 변경하지 않습니다.

## TimeTree 참고 화면 개편 (#57)
- 홈 월 요약 카드를 제거하고 달력이 남은 화면을 채웁니다. 세로선은 없애고 주간 가로선을 옅게 표시하며, 기존 날짜별 금액·점·하단 메뉴는 유지합니다. 긴 내용과 짧은 화면은 세로 스크롤로 접근합니다.
- 좌측 연월 제목에서 연도·월을 선택하고 `이동`으로 적용합니다. 취소·바깥 클릭·Escape는 월을 바꾸지 않습니다. 같은 월은 선택 날짜를 유지하며 다른 월은 기존 규칙대로 1일로 이동합니다. 미래 월은 제한합니다.
- 마이페이지는 원형 이니셜·닉네임·이메일을 중앙에 표시하고 기존 메뉴를 유지합니다. `프로필 설정`은 현재 닉네임을 수정할 수 있는 계정관리로 연결합니다. 사진 업로드·저장은 별도 기능입니다.
- 공통 시각 기준은 `src/styles/visual-theme.css`, 접근 가능한 로딩은 `LoadingStatus`에서 관리합니다. 조용한 재조회는 스피너를 추가하지 않으며 메뉴·팝업의 짧은 등장 효과는 모션 감소 설정에서 제거됩니다.
- API·금액 계산·저장 정책과 기존 예산 준비·튜토리얼 흐름은 변경하지 않습니다.

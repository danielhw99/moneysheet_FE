# FE 운영 이미지

이 저장소의 Dockerfile은 React 정적 파일과 Caddy를 담습니다. 운영 Compose/Caddyfile은 BE 저장소의 `moneysheet/deploy/`에서 관리합니다. 공개 서버 배포·GHCR 게시·CD는 후속 작업입니다.

## 빌드

FE 저장소 루트에서 Docker Engine이 있는 개발 PC 또는 CI로 실행합니다.

```sh
docker build --pull -t moneysheet-fe:local .
```

빌드 컨텍스트는 앱 폴더가 아닌 저장소 루트입니다. Node 22와 Caddy 2의 공식 이미지 manifest digest를 Dockerfile에 고정했고 pnpm은 package.json과 같은 10.34.3을 사용합니다. 잠금파일 설치 실패·빌드 실패 시 이미지 생성이 실패합니다. 베이스 이미지 갱신은 digest를 명시적으로 변경한 뒤 재검증합니다. `latest` 태그를 운영 배포 버전으로 사용하지 않습니다. GHCR 주소·FE/BE 배포 이미지 조합은 후속 배포 설정에서 확정합니다.

`.dockerignore`는 기본 제외 후 필요한 manifests, src, public, Vite 설정과 `.figma/make/site.json`만 허용합니다. 이 JSON은 기존 Vite 빌드가 사용하는 공개 사이트 메타데이터입니다. 로컬 .env·키·덤프·로그·node_modules·dist·Git 정보·테스트 파일은 제외합니다. Vite가 정적 파일에 넣는 값은 공개 정보이며 비밀값을 넣으면 안 됩니다.

멀티 스테이지의 build 단계에만 Node·pnpm·소스·의존성이 있습니다. 최종 runtime에는 Caddy와 `/usr/share/caddy`의 산출물만 남습니다. 운영 노트북에서는 CI가 게시한 이미지를 받아 실행합니다. 이번 Ubuntu 소스 빌드는 격리된 일회성 검증이며 운영 배포 방법이 아닙니다.

## 단독 정적 파일 확인

```sh
docker run --rm --name moneysheet-fe-check -p 127.0.0.1:18079:80 moneysheet-fe:local
```

`http://127.0.0.1:18079/`에서 정적 파일이 제공되는지만 확인합니다. 기본 공식 Caddy 설정은 정적 파일 서버이므로 API 연결·SPA 하위 경로 fallback·실제 로그인까지 제공하지 않습니다. 기본 명령은 공식 이미지의 `caddy run --config /etc/caddy/Caddyfile --adapter caddyfile`을 그대로 사용합니다. 중지는 실행 터미널의 Ctrl+C이며 `--rm`으로 해당 검증 컨테이너만 제거됩니다.

## BE #22와의 연결 계약

| 항목 | 값·담당 |
| --- | --- |
| FE 이미지 | 이 Dockerfile로 빌드한 이미지 |
| 정적 파일 root | `/usr/share/caddy` |
| 설정 주입 | BE가 관리하는 Caddyfile을 `/etc/caddy/Caddyfile:ro`로 마운트 |
| API | `/api/*`를 BE 서비스로 프록시, `/api/v1` prefix와 오류 응답 보존 |
| SPA | 정적 파일이 없는 화면 경로만 `/index.html` fallback |
| assets | `/assets/*`의 없는 파일은 404, HTML fallback 제외 |
| 캐시 | index.html의 오래된 재사용 방지·해시 assets 캐시는 BE Caddy 설정에서 결정 |
| HTTPS | BE 운영 Caddyfile·DDNS 단계에서 설정. `/data`, `/config` 영속화 |
| 네트워크 | Caddy↔BE, DB 네트워크 미연결. 2019 관리 포트 호스트 공개 금지 |

Compose 검증에서는 FE/Caddy·BE·격리 MySQL을 사용합니다. Windows의 `localhost:8080`을 컨테이너의 upstream으로 사용하지 않습니다. FE 소스에 운영 API 호스트를 굽지 않고 기존 동일 출처 `/api/v1`을 유지합니다. SPA fallback보다 API/asset 처리가 우선해야 합니다.

## 검증 항목

- 기존 `pnpm check`: 테스트·타입·프로덕션 빌드
- Dockerfile 실제 빌드, `/`·해시 JS 파일의 200 및 없는 assets의 404
- 최종 이미지에서 Node·pnpm·앱 node_modules 부재
- Docker context 검사로 합성 .env·개인키·node_modules 표식 제외 확인
- 임시 Caddy 설정 주입 시 `/daily` fallback, upstream 503 상태/본문 보존
- 별도 검증 컨테이너·네트워크 종료, 기존 DB/개발 서비스 유지

위 HTTP 격리 검사는 실제 BE 인증·MySQL·운영 HTTPS 검증을 대신하지 않습니다. 이 부분은 BE #22 통합 및 이후 공개 배포 단계에서 확인합니다. Windows Docker가 없을 때는 승인된 검증 호스트 또는 CI를 사용하며 Docker Desktop 설치를 필수로 만들지 않습니다.

공식 명령 참고: https://caddyserver.com/docs/command-line


## #79 실행 결과 — 2026-11-25

- Windows Node 22.23.5 / pnpm 10.34.3: 테스트317개·타입 검사·빌드 통과.
- Ubuntu x86_64 Docker 29.1.3의 별도 검증 디렉토리에서 멀티 스테이지 이미지 빌드 통과. Caddy v2.11.9 실행 확인. Buildx는 해당 검증 호스트에 없어 기본 Docker builder로 검증했다.
- 기본 설정의 `/`·해시 JS 200, 없는 assets 404 통과. 최종 이미지의 Node·pnpm·앱 node_modules 부재 확인.
- 실제 Docker context probe 빌드에서 합성 .env·src/.env.local·public/.env·public/private.key·node_modules 표식·루트 README 제외, 빌드용 site.json 포함 확인.
- 임시 Caddyfile 마운트와 격리 upstream으로 SPA `/daily` 200, API upstream 503 상태/본문 유지, 없는 assets 404 확인.
- 검증용 컨테이너와 네트워크는 종료·제거했다. 개발 DB·기존 FE/BE·공개 포트는 변경하지 않았다. 검증 이미지/빌드 캐시는 재검증용으로 호스트에 남는다.
- 실제 BE·MySQL Compose 연결·운영 HTTPS·GHCR 게시 검증은 미실시이며 BE #22와 이후 배포 작업으로 남는다.

## Private GHCR 게시

[게시 절차](ghcr.md)를 따릅니다. 실제 게시·pull은 PR 병합 후 별도로 검증합니다.

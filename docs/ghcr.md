# Private GHCR 게시 (FE #81)

## 실행 순서

1. 이 PR을 기본 브랜치에 반영해야 `workflow_dispatch`가 등록됩니다. 기본 브랜치가 `main`이면 먼저 정상 PR 절차로 워크플로를 main에도 반영합니다. 임시 공개 게시나 PR 이벤트로 우회하지 않습니다.
2. `dev`의 **게시할 커밋**에 `FE tests` push CI가 성공했는지 확인합니다.
3. Actions → `FE private images` → Run workflow → **dev**를 선택합니다. 실행 시작 시점의 전체 SHA를 checkout하며, 해당 SHA의 push CI 성공만 인정합니다. 이후 dev가 변경되어도 이 실행의 소스는 바뀌지 않습니다.
4. 모든 타깃의 로컬 빌드가 끝난 뒤에만 GHCR 로그인을 합니다. `linux/amd64`, 전체 SHA 태그와 OCI source/revision 라벨을 사용합니다.
5. 게시 후 Private 여부·digest pull·revision을 확인하고 성공한 실행의 Summary 및 `images.env` artifact를 확인합니다. 운영에서는 태그 대신 이 **digest**를 사용합니다.

## 권한과 실패 대응

- 패키지 게시에는 job 범위 `packages: write`의 단기 `GITHUB_TOKEN`만 사용합니다. 앱 비밀값·SSH 키·장기 쓰기 PAT는 Actions에 등록하지 않습니다.
- 최초 패키지는 GHCR 기본값 Private으로 생성됩니다. 기존 Public 패키지이면 게시 전 중단하고, 게시 후에도 Private을 확인합니다. 패키지 설정 변경으로 공개되지 않도록 소유자가 관리해야 합니다.
- 패키지 API 403은 실패입니다. 404는 최초 게시 전만 허용하며, 기존 패키지가 있으나 권한이 없는 경우 패키지의 Manage Actions access에 이 저장소를 추가하고 재실행합니다.
- CI 미완료/실패·빌드·권한·게시·검증 실패는 전체 실행 실패입니다. 재실행은 동일 dev SHA의 검증 성공이 필요합니다. 일부 이미지가 이미 올라갔더라도 실패한 실행은 배포 대상으로 쓰지 않습니다.
- PR에서는 게시하지 않습니다. 수동 실행도 dev만 허용합니다. 자동 배포·서비스 기동·DB 변경·방화벽 변경은 없습니다.
- GitHub Artifact 보존 기간은 90일입니다. 실제 사용한 digest는 운영 서버 releases 기록에도 보관합니다.

## 검증 범위

PR 단계에서는 정책 단위 테스트·워크플로 구문 검사를 수행합니다. 실제 GHCR 게시/Private 확인/인증된 pull은 워크플로가 기본 브랜치에 반영된 뒤 수동 실행으로 확인해야 하며, PR 작성 시 성공했다고 간주하지 않습니다.

## 기준 문서

- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow
- https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry

## PR 단계 검증 기록 (2026-11-25)

- 게시 정책 Node 테스트 9개 통과: 정확한 SHA·push CI·소유 저장소·Private·403/404 분기.
- actionlint 1.7.7로 저장소 내 워크플로 구문 검사 통과.
- 앱 소스·Dockerfile 변경 없음. 앱 전체 테스트는 기존 PR CI에서 수행합니다. 실제 게시·서버 인증·pull은 위 후속 검증으로 남습니다.

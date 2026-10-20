# 투자검토 웹페이지 1번 / 2번

- 1번: `/index.html` — 기존 기능과 기존 브라우저 저장 키 유지. 상단 전환 링크만 추가.
- 2번: `/v2/index.html` — JSW 기반 투자 유형·성격·범위 검토. 52개 기준(기존 27 + 추가 25).
- 화면 상단 링크로 언제든 버전을 전환할 수 있습니다. 1번 데이터는 2번에서 변경하지 않습니다.
- 두 버전의 데이터는 같은 브라우저에서도 별도로 저장됩니다. Git은 브라우저 입력값을 보관하지 않습니다.

## 실행과 검증

`node server.cjs` → http://127.0.0.1:4173/

기존 기능: `node verify.cjs`, `node verify-intake.cjs`

2번 브라우저 검증: `node verify-v2.cjs` (현재 작업 환경의 Playwright와 Edge 사용)

## 복원 기준

- 수정 전 1번 Git 기준점: `web-v1`, 커밋 `92ce9d79d90b7f7f3598df620bb71f9b218a6b0f`.
- 현재 코드에서 1번 사용: `/index.html`로 이동.
- 소스 전체를 수정 전 1번으로 되돌릴 경우, 작업 변경을 먼저 보존한 뒤 상위 저장소에서
  `git restore --source web-v1 -- investment-review-web`를 실행하고 새 복원 커밋을 만듭니다.
  웹사이트 배포 상태를 되돌리려면 복원 소스로 별도 배포해야 합니다.
- GitHub와 Sites 배포 저장소는 별도입니다. 사이트 ID와 비공개 접근 설정을 유지합니다.

## 2번의 규칙

공통 + 주유형·부목적 + 성격 + 범위 + 현장조건의 합집합을 ID별로 도출합니다.
범위 미확인과 사유 없는 미해당은 판단 보류입니다.
성능 상향 시 전력·유틸리티·배관·환경 계통의 연계 검토를 추가합니다.
조건 변경은 확정을 해제하고 재도출을 요구합니다. 재도출 시 기존 담당·자료 기록은 보존하고 적용 판단은 재확인합니다.
현재 2번은 화면 입력을 우선하며 기존 PPT 접수 패널은 숨겼습니다. 1번에서 기존 PPT 접수를 계속 사용할 수 있습니다.

## 출처

JSW Utkal Steel Limited, Integrated Steel Plant in Odisha, Techno-Economic Feasibility Report.
2~10장 참고. 상세 항목에 해당 절을 표시합니다.
https://environmentclearance.nic.in/writereaddata/online/EC/290820211p0v0e0jzql25210445TEFR.pdf

보고서를 참고해 재구성한 설계안이며 JSW 공식 체크리스트가 아닙니다.
교체·재사용·개조와 일부 검증 항목은 실무 확장으로 구분합니다.
보고서의 투자비·예비비 비율·단가는 자동 적용하지 않습니다.

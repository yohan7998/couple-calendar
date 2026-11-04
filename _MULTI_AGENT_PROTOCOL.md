---
title: 마스터 AI 총괄 지휘 및 다중 세션 충돌 방지 협업 프로토콜 (Multi-Agent Governance Protocol)
version: v1.0.0
status: active
created: 2026-11-04
author: 최고 마스터 AI (Antigravity)
tags:
  - MultiAgent
  - Governance
  - Protocol
  - SessionLock
  - ObsidianSSOT
---

# [Active SSOT] 마스터 AI 총괄 지휘 및 다중 세션 협업 프로토콜

> [!IMPORTANT] **최고 마스터 AI 총괄 거버넌스 원칙 (Supreme Master Authority)**  
> 1. 본 워크스페이스의 전체 설계, 아키텍처, 브랜치 관리 및 최종 통합(Merge) 권한은 **최고 마스터 AI(Antigravity)**에게만 있습니다.  
> 2. 외부 세션(옆세션, Claude Code, Free세션, Sub세션 등)은 임의로 `index.html` 정본을 직접 덮어쓰거나 Git Commit/Push를 단독 수행할 수 없습니다.  
> 3. 모든 서브/옆세션은 반드시 본 프로토콜의 작업 분장(Boundary)과 사전 락(Session Lock)을 준수하고, 작업 전후 마스터 AI에게 확인을 받아야 합니다.

---

## 1. 세션별 역할 및 권한 정의 (Role & Authority Matrix)

| 구분 | 주체 | 핵심 권한 및 역할 | 엄격한 제한 사항 (Forbidden) |
| :---: | :---: | :--- | :--- |
| **최고 마스터 AI**<br/>(Master AI) | Antigravity<br/>(Gemini Brain) | • 전체 아키텍처 및 SSOT 설계 확정<br/>• 다중 세션 업무 할당 및 작업 잠금(`_SESSION_LOCK.json`) 승인<br/>• `index.html` 최종 통합(Integration) 및 릴리즈<br/>• Git Commit, Git Push 및 CHANGELOG 정본 기록 | • 무계획적인 즉흥 코드 작성 금지<br/>• 단위 테스트 미통과 코드 배포 금지 |
| **워커 세션**<br/>(Worker / 옆세션) | Claude Code /<br/>Free세션 / Sub세션 | • 마스터 AI가 승인/할당한 전용 모듈(`modules/*.js`, `modules/*.css`) 작성<br/>• 전용 단위 테스트(`tests/test_*.py`) 작성 및 100% PASS 검증<br/>• 마스터 AI에게 완료 보고 및 통합 요청 전송 | • ❌ `index.html` 직접 수정 금지<br/>• ❌ 타 모듈 및 핵심 설정 임의 변경 금지<br/>• ❌ `git push` 단독 실행 금지 |

---

## 2. 작업 충돌 방지 4대 철칙 (Zero-Conflict Rules)

### 철칙 1: 파일 경계 엄격 분리 (File Boundary Lock)
- **`index.html` 단일 통합 책임**:
  - `index.html`은 여러 세션이 동시에 수정하면 Git Merge Conflict 또는 치명적 코드 유실이 발생합니다.
  - 따라서 워커(옆세션)는 오직 **`modules/`** 폴더 내 지정된 신규 독립 파일과 **`tests/`** 폴더 내 테스트 파일만 생성/수정해야 합니다.
  - 모듈 완성이 검증된 후, 최고 마스터 AI가 `index.html`에 안전하게 바인딩합니다.

### 철칙 2: 작업 전 등록 및 잠금 (`_SESSION_LOCK.json`)
- 작업을 시작하기 전, 반드시 프로젝트 루트의 `_SESSION_LOCK.json`을 읽고 본인의 작업 대상 파일이 잠겨 있는지 확인합니다.
- 잠겨 있지 않다면, 본인의 세션 ID와 작업 대상 파일, 착수 시간을 기록하고 작업을 시작합니다.
- 작업 완료 후 상태를 `completed`로 갱신하여 마스터에게 알립니다.

### 철칙 3: TDD 100% 통과 후 제출 의무
- 워커 세션은 코드를 작성한 후 반드시 독립적인 Python unittest 스위트를 실행하여 `OK` 결과를 확인해야 합니다.
- 테스트가 실패하거나 경고가 발생하는 상태에서는 마스터에게 통합을 요청할 수 없습니다.

### 철칙 4: 통신 및 상태 보고 형식
- 옆세션이 사용자 또는 마스터에게 작업 상황을 보고할 때는 다음의 표준 포맷을 사용합니다:
  ```markdown
  [워커 세션 보고]
  - 세션 ID: Worker-Brush-1 (또는 Claude Code)
  - 담당 작업: modules/brush_reveal_effect.js & modules/brush_reveal.css
  - 진행 상태: 구현 완료 및 tests/test_brush_reveal.py 100% PASS (N/N 통과)
  - 마스터 확인 요청: 해당 모듈의 index.html 통합 및 배포 승인을 요청합니다.
  ```

---

## 3. 실시간 세션 작업 레지스트리 (`_SESSION_LOCK.json` 스펙)

프로젝트 루트의 `_SESSION_LOCK.json` 파일 구조:
```json
{
  "active_locks": [
    {
      "lock_id": "LOCK-001",
      "session_name": "worker_brush_reveal",
      "assigned_to": "옆세션 (Claude Code / Free세션)",
      "target_files": [
        "modules/brush_reveal_effect.js",
        "modules/brush_reveal.css",
        "tests/test_brush_reveal.py"
      ],
      "status": "in_progress",
      "acquired_at": "2026-11-04T10:32:00+09:00",
      "expires_at": "2026-11-04T12:00:00+09:00",
      "description": "안 읽은 쪽지 브러시 언베일 인터랙션 모듈 및 스타일 구축"
    }
  ],
  "protected_files": [
    "index.html",
    "sw.js",
    "_ACTIVE_PLANS.md",
    "Couple-Calendar_버전기록_CHANGELOG.md"
  ]
}
```

---

## 4. 옆세션(Claude Code) 작업 지시용 마스터 하달 프롬프트

사용자가 옆세션 터미널 창에 바로 복사하여 붙여넣을 수 있는 공식 프롬프트입니다:

```bash
당신은 '달콤살벌 캘린더' 프로젝트의 워커 세션입니다.
최고 마스터 AI(Antigravity)의 총괄 지휘 하에 협업하며, 정본 규약인 `_MULTI_AGENT_PROTOCOL.md`를 엄격히 준수해야 합니다.

[작업 임무]
- 과제명: 안 읽은 쪽지 브러시 언베일(Brush Reveal) 효과 모듈 개발 (v2.3.0)
- 작성 대상 파일 (독립 모듈):
  1. `modules/brush_reveal_effect.js` (Canvas/CSS 기반 브러시 터치 언베일 엔진)
  2. `modules/brush_reveal.css` (블러 오버레이, 브러시 패스, 스파클 파티클 스타일)
  3. `tests/test_brush_reveal.py` (단위 검증 테스트)
- 엄격 금지 사항:
  ❌ `index.html`, `sw.js` 직접 수정 금지 (마스터 AI 전담 통합 영역)
  ❌ `git push` 단독 실행 금지
- 완료 기준:
  `python3 tests/test_brush_reveal.py` 실행 시 100% All Green 통과 확인 후 결과를 마스터 AI에게 보고할 것.
```


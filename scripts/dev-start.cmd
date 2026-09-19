@echo off
rem VUA one-click dev launcher. Double-click or pin a shortcut to it.
rem Solves: no more folder -> right-click -> terminal ritual; the console window
rem closes itself when the dev stack exits (closing the app window tree-kills
rem vite+electron via scripts/dev.mjs); freshness vs origin/main is printed
rem (and offered as a fast-forward) before every launch.
rem NOTE: this file must keep CRLF line endings - LF-only batch files parse
rem erratically (that was the 2026-09-19 "hangs after the version line" bug).
rem Freshness hardening: a plain cmd session lacks the Git Bash network/
rem credential context, so GIT_TERMINAL_PROMPT=0 forbids silent credential
rem prompts and lowSpeed caps bound a stalled GitHub transfer to ~8s; on failure
rem the behind/ahead numbers are labeled "as of last successful fetch".
rem Pass --no-fetch to skip the network check entirely.
rem Set VUA_DEV_START_DRYRUN=1 to test everything except the actual launch.
setlocal EnableDelayedExpansion
cd /d "%~dp0\.."

echo === VUA dev launcher ===

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo [error] not inside a git checkout: %CD%
  pause
  exit /b 1
)

for /f %%b in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%b"
for /f %%c in ('git rev-parse --short HEAD') do set "COMMIT=%%c"
for /f %%v in ('node -p "require('./apps/desktop/package.json').version" 2^>nul') do set "VER=%%v"
echo branch  : !BRANCH!
echo version : !VER! ^(commit !COMMIT!^)

set "GIT_TERMINAL_PROMPT=0"
set "FETCH_OK=0"
if /i "%~1"=="--no-fetch" (
  echo [skip] --no-fetch given - freshness as of last fetch
) else (
  git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=8 fetch origin main --quiet 2>nul
  if not errorlevel 1 set "FETCH_OK=1"
  if "!FETCH_OK!"=="0" echo [warn] fetch failed/slow - freshness as of last successful fetch
)

set "BEHIND=0"
set "AHEAD=0"
if /i "!BRANCH!"=="main" (
  for /f %%n in ('git rev-list --count HEAD..origin/main 2^>nul') do set "BEHIND=%%n"
  for /f %%n in ('git rev-list --count origin/main..HEAD 2^>nul') do set "AHEAD=%%n"
  if !BEHIND! gtr 0 (
    echo [update] local main is !BEHIND! commit^(s^) behind origin/main
    git status --porcelain --untracked-files=no | findstr . >nul
    if errorlevel 1 (
      set /p "PULL=fast-forward to origin/main now? [Y/n] "
      if /i not "!PULL!"=="n" (
        git merge --ff-only origin/main || echo [warn] fast-forward failed - resolve manually
      )
    ) else (
      echo [skip] tracked local changes present - not pulling
    )
  ) else (
    if "!FETCH_OK!"=="1" (
      echo [ok] main up to date ^(local ahead !AHEAD!^)
    ) else (
      echo [info] no newer commits as of last fetch ^(local ahead !AHEAD!^)
    )
  )
) else (
  echo [info] not on main ^(!BRANCH!^) - freshness check skipped
)

echo.
echo starting dev stack - closing the app window stops everything.
if defined VUA_DEV_START_DRYRUN (
  echo [dry-run] stop before launch
  exit /b 0
)
pnpm -C apps/desktop dev

# Goal: make the whole auth test suite pass without weakening any assertion

<!--
  Sample trial-and-error log. Claude writes this in the WORKING folder when a
  compromise is tempting, then converges. The Stop hook counts the `[try N]`
  lines; once 3 pile up with no resolution marker, it forces delegation.
  Mark the log RESOLVED / DELEGATED / NEEDS-USER (at the start of a line) to stop.
-->

- [try 1] Mock the clock and advance it past expiry → failed: refresh still races the read; flaky, ~30% fail (cause: refresh runs on a separate microtask)
- [try 2] Await the refresh promise before asserting → failed: deadlocks the second test (cause: the same singleton promise is reused across tests)
- [try 3] Reset the singleton between tests → failed: passes locally, fails in CI (cause: CI runs tests in parallel; shared module state leaks)

(3 unresolved attempts — the Stop hook would block here and force delegation.)

- [try 4] Delegated to a fresh agent with only the goal + invariant "no assertion weakened". Agent isolated module state per test via a factory instead of a singleton → suite green, locally and in CI.

RESOLVED — verified by an independent review pass (no assertions weakened; root cause was shared singleton state, not the clock).

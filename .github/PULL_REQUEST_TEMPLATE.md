## Problem and scope

What problem does this PR solve? Link with `fixes #...` and list what is intentionally out of scope.

## Change type

- [ ] Bug fix
- [ ] Feature or vertical-slice migration
- [ ] Campus Blue/design-system change
- [ ] Database migration
- [ ] Security/operations hardening
- [ ] Documentation only

## Test evidence

List exact commands, result counts and manual routes/roles/viewports. Do not write only “works locally”.

```text
# command -> result
```

## Visual evidence

Required for UI changes: sanitized desktop + mobile screenshots and dark mode when affected. State `Not applicable` otherwise. Do not include real student data.

## Migration and compatibility note

State `None` or describe schema/config/API changes, upgrade order, backfill, rollback and data-loss risk.

## Security, privacy and observability

- Authorization/class ownership impact:
- PII/wellbeing/SOS handling:
- Logs, request ID, health/alerting impact:
- Secret or operator action required:

## Checklist

- [ ] I used the shared design/API/architecture seams instead of adding a duplicate abstraction.
- [ ] Frontend lint, typecheck, build and audit pass when frontend/dependencies changed.
- [ ] Backend compileall, pytest and pip-audit pass when backend/dependencies changed.
- [ ] New/changed behavior has regression or policy tests.
- [ ] Docs/OpenAPI/types/changelog are updated when their contract changed.
- [ ] Migration and rollback evidence is included or explicitly not applicable.
- [ ] Screenshots/logs/examples contain no credential, token, certificate or real student data.
- [ ] Known limitations and unsupported claims remain explicit.

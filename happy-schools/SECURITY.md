# Security Policy

This document describes the security practices and reporting process for the
_Happy‑Schools_ project. Maintaining a safe codebase and responsible
vulnerability disclosure is a priority.

## Supported Versions

We provide security patches for the following branches:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < main  | :warning: Limited  |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security bugs. Instead,
report via email to **security@happy-schools.local** (replace with your own
contact). Include:

- Description of the vulnerability (SQL injection, XSS, etc.)
- Files/locations where the issue appears
- Steps to reproduce or proof‑of‑concept
- Impact assessment

You should receive a response within 48 hours.

## Safe Harbor

We welcome responsible disclosure and ask researchers to:

- Avoid data destruction or privacy violations
- Only interact with resources you own or have permission for
- Do not publicly disclose until fixed

## Security Measures & Best Practices

- Use parameterized queries / ORM to prevent injection
- Validate and sanitize all input
- Never commit `.env` files or secrets
- Keep dependencies up to date and run `npm audit` / `pip-audit`
- Use HTTPS in production and secure headers

## Incident Response

1. Assess scope/impact
2. Contain and patch
3. Notify affected parties
4. Review and improve processes

_Last updated: 2026-02-23_

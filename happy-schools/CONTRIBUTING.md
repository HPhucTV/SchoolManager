# Contributing to Happy‑Schools

Thank you for considering contributing! Contributions make the project better
and are greatly appreciated. Please take a moment to read this guide before
submitting changes.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Style Guidelines](#style-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project uses the [Code of Conduct](CODE_OF_CONDUCT.md). By participating you
agree to abide by its terms.

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies:
   ```bash
   cd happy-schools
   # backend
   python -m venv .venv
   source .venv/Scripts/activate
   pip install -r backend/requirements.txt
   # frontend
   npm install
   ```
3. Set up environment variables (see .env.example and .env.local.example).
4. Run the servers for development:
   ```bash
   # backend
   uvicorn backend.app.main:app --reload
   # frontend
   npm run dev
   ```

## How Can I Contribute?

### Reporting Bugs

- Search existing issues before opening a new one.
- Provide a clear title, steps to reproduce, and expected vs actual behavior.
- Include screenshots or logs if helpful.

### Suggesting Enhancements

- Describe current behavior and desired improvement.
- Explain why it would be useful.

### Contributing Code

Areas open to contribution include:

- Backend API and services (FastAPI/Python)
- Frontend components (Next.js/TypeScript)
- AI dataset and chatbot responses
- Tests, documentation, and tooling

## Development Workflow

1. **Branching**: create feature branches from `main` (e.g., `feature/xyz`).
2. **Work**: write code, add tests, update documentation.
3. **Test**: run `just test` or manually run backend/frontend tests.
4. **Commit**: use conventional commit messages (see below).
5. **Push & PR**: push branch and open a pull request against `main`.

## Style Guidelines

- Python: follow PEP8, use type hints, max line length 88 (Black).
- TypeScript/React: functional components, Tailwind CSS, meaningful names.

## Commit Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>
```

Example: `feat: add teacher report chatbot`.

## Pull Request Process

- Target the `main` branch.
- Provide a clear title and description.
- Reference related issues (e.g., `fixes #123`).
- Include screenshots for UI changes.
- Ensure tests and linters pass.

Thanks again for your interest in contributing!

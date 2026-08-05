"""Deprecated entry point kept to stop unsafe legacy migration attempts.

Schema provisioning now lives in the backend image and versioned changes use
Alembic. This file intentionally performs no database writes.
"""


MESSAGE = """scripts/migrate_new_features.py is retired.

From the backend directory run:
  python -m scripts.provision_schema
  alembic -c alembic.ini upgrade head

Create the first production administrator separately with:
  python -m scripts.create_admin
"""


if __name__ == "__main__":
    raise SystemExit(MESSAGE)

"""Create the current schema baseline without inserting demo data.

Run from ``backend`` with ``python -m scripts.provision_schema``. Existing
tables are left intact; Alembic remains responsible for versioned upgrades.
"""

from app import models  # noqa: F401  Ensures every model is registered.
from app.database import Base, engine


def provision_schema() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    provision_schema()
    print("Schema baseline is ready; no demo accounts or sample records were created.")

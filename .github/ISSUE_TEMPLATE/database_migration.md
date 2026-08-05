---
name: Database migration
about: Propose a schema, backfill, compatibility, or rollback change
title: "[Migration] "
labels: database, migration
---

## Problem and domain impact

What current workflow or invariant requires a database change?

## Proposed schema change

List tables, columns, constraints and indexes. Include the expected Alembic revision boundary.

## Existing data and backfill

How are nulls, legacy values and large datasets handled? Do not attach real student data or dumps.

## Compatibility window

Can old and new application versions run against the schema during rollout?

## Upgrade verification

Commands/tests and expected evidence.

## Rollback and data-loss risk

Describe downgrade or forward-fix strategy. State explicitly if rollback is destructive.

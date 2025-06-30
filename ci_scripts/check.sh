#!/bin/bash
set -e
set -o pipefail

uv run ruff format --check .
uv run ruff check .
uv run pytest .
#!/bin/bash
set -e
set -o pipefail

uv run ruff format .
uv run ruff check --fix .
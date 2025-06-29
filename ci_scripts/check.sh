#!/bin/bash
set -e
set -o pipefail

ruff format --check .
ruff check .
pytest .
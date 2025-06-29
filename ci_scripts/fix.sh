#!/bin/bash
set -e
set -o pipefail

ruff format .
ruff check --fix .
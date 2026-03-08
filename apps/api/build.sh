#!/usr/bin/env bash
set -o errexit

echo "==> Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Verifying uvicorn installation..."
python -m uvicorn --version

echo "==> Build complete!"

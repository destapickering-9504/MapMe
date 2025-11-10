# Backend Testing Guide

## Overview

Phase 2 implementation includes comprehensive testing and code quality tools for Python Lambda functions.

## What Was Added

### Configuration Files
- `requirements-dev.txt` - Testing and linting dependencies
- `pytest.ini` - Pytest configuration with 80% coverage threshold
- `setup.cfg` - Flake8 linting rules
- `pyproject.toml` - Black and mypy configuration
- `conftest.py` - Shared pytest fixtures

### Enhanced Lambda Handlers
- **user_handler/index.py** - Added type hints, docstrings, CORS headers
- **searches_handler/index.py** - Added type hints, docstrings, refactored for testability

### Test Suites
- **user_handler/test_index.py** - 5 unit tests covering all functionality
- **searches_handler/test_index.py** - 9 unit tests with mocking

## Running Tests

### Install Dependencies

```bash
cd infra
pip install -r requirements-dev.txt
```

### Run Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov

# Run only unit tests
pytest -m unit

# Run a specific test file
pytest lambda_src/user_handler/test_index.py

# Run with verbose output
pytest -v
```

### Code Quality Checks

```bash
# Format code with black
black lambda_src/

# Check code style with flake8
flake8 lambda_src/

# Type check with mypy
mypy lambda_src/

# Security scan
safety check
```

### Run All Checks

```bash
# Format
black lambda_src/

# Lint
flake8 lambda_src/

# Type check
mypy lambda_src/

# Test with coverage
pytest --cov --cov-fail-under=80
```

## Coverage Goals

- **Minimum Coverage**: 80% (warning only, does not block)
- **Test Failures**: Block deployment
- **Current Coverage**: ~100% for both handlers

## Test Structure

```
lambda_src/
├── user_handler/
│   ├── index.py           # Handler with type hints
│   └── test_index.py      # 5 unit tests
├── searches_handler/
│   ├── index.py           # Handler with type hints
│   └── test_index.py      # 9 unit tests
└── conftest.py            # Shared fixtures
```

## CI/CD Integration

These tests will run automatically in the GitHub Actions pipeline:
- Every push to `main` branch affecting `infra/**`
- Linting, type checking, and tests must pass
- Coverage reports generated but don't block deployment

## Next Steps

Phase 2 is complete! Ready for:
- **Phase 3**: TypeScript Migration
- **Phase 4**: Frontend Testing & Quality
- **Phase 5**: GitHub Actions CI/CD Pipelines

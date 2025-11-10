# Contributing to MapMe

Thank you for contributing to MapMe! This document provides guidelines and workflows for development.

## Development Workflow

### Branch Strategy

```
main (protected)
  ↓
feature/your-feature
bugfix/your-fix
hotfix/critical-fix
```

**Branch Naming:**
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates

### Getting Started

1. **Clone the repository**
```bash
git clone https://github.com/destapickering-9504/MapMe.git
cd MapMe
```

2. **Install dependencies**
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../infra
pip install -r requirements-dev.txt
```

3. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

### Making Changes

#### Frontend Changes

```bash
cd frontend

# Run development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
npm run format:check

# Type check
npm run type-check

# Run all checks before committing
npm run type-check && npm run lint && npm run format:check && npm test -- --run
```

#### Infrastructure Changes

```bash
cd infra

# Format code
black lambda_src/

# Lint
flake8 lambda_src/

# Type check
mypy lambda_src/

# Run tests
pytest --cov

# Terraform checks
terraform fmt -recursive
terraform validate
terraform plan
```

### Commit Messages

Follow the **Conventional Commits** specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**
```bash
git commit -m "feat(frontend): add user profile page"
git commit -m "fix(backend): resolve search query timeout"
git commit -m "docs: update deployment instructions"
git commit -m "ci: add frontend deployment pipeline"
```

### Pull Request Process

1. **Ensure all tests pass**
```bash
# Frontend
cd frontend && npm test -- --run

# Backend
cd infra && pytest --cov
```

2. **Update documentation** if needed

3. **Create pull request** with:
   - Clear title following commit convention
   - Description of changes
   - Link to related issues
   - Screenshots (if UI changes)

4. **Wait for CI/CD checks** to pass

5. **Request review** from maintainers

6. **Address feedback** and push updates

7. **Merge** after approval

### Code Review Guidelines

**Reviewers should check:**
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] CI/CD pipelines pass
- [ ] Breaking changes are documented

### Testing Requirements

#### Frontend
- Unit tests for components
- Type safety (TypeScript)
- ESLint compliance
- Prettier formatting
- 80%+ code coverage (recommended)

#### Backend
- Unit tests for Lambda functions
- Type hints (mypy)
- Black formatting
- Flake8 compliance
- 80%+ code coverage (required)

### CI/CD Pipelines

**Automatic Deployment:**
- Changes to `frontend/**` trigger frontend pipeline
- Changes to `infra/**` trigger infrastructure pipeline

**Pipeline Stages:**
1. Test & Lint
2. Security Scan
3. Build
4. Deploy (main branch only)

### Local Pre-commit Checks

**Optional**: Install pre-commit hooks

```bash
# Frontend
cd frontend
npm run lint:fix
npm run format
npm test -- --run

# Backend
cd infra
black lambda_src/
flake8 lambda_src/
pytest --cov
```

## Project Structure

```
MapMe/
├── .github/workflows/     # CI/CD pipelines
│   ├── frontend-deploy.yml
│   └── infrastructure-deploy.yml
├── frontend/              # React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── test/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── infra/                 # Terraform + Python
│   ├── lambda_src/
│   │   ├── user_handler/
│   │   └── searches_handler/
│   ├── *.tf              # Terraform files
│   ├── requirements-dev.txt
│   └── pytest.ini
└── docs/                  # Documentation
```

## Environment Variables

### Local Development

**Frontend** (`.env.local`):
```
VITE_REGION=us-west-1
VITE_USER_POOL_ID=...
VITE_USER_POOL_CLIENT_ID=...
VITE_IDENTITY_POOL_ID=...
VITE_API_BASE=...
VITE_AVATARS_BUCKET=...
```

**Infrastructure** (`infra/terraform.tfvars`):
```hcl
aws_region = "us-west-1"
# Other configuration...
```

## Getting Help

- **Issues**: Open a GitHub issue
- **Questions**: Use GitHub Discussions
- **Security**: Email maintainers directly

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## License

This project is proprietary. See LICENSE file for details.

## Quick Reference

```bash
# Frontend development
cd frontend && npm run dev

# Run all frontend checks
npm run type-check && npm run lint && npm test -- --run

# Backend development
cd infra && terraform plan

# Run all backend checks  
black lambda_src/ && flake8 lambda_src/ && mypy lambda_src/ && pytest --cov

# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-feature
```

## Deployment

Deployments are automated via GitHub Actions:
- Push to `main` triggers production deployment
- Pull requests show deployment previews (if configured)
- Manual deployments via workflow_dispatch

See `.github/workflows/README.md` for pipeline details.

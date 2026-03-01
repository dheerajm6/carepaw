# Contributing to CarePaw

Thanks for your interest in contributing! Please follow the workflow below.

## Branch Rules

- **`main` is protected** — direct pushes are not allowed for contributors.
- All contributions must come in via a **Pull Request** from a feature branch.
- PRs require **1 approving review** before they can be merged.

## Workflow

1. **Fork** the repository.
2. Create a branch off `main` with a descriptive name:
   ```
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit:
   ```
   git commit -m "Short description of the change"
   ```
4. Push to your fork:
   ```
   git push origin feature/your-feature-name
   ```
5. Open a **Pull Request** against `main` on this repo.
6. Wait for review and address any feedback.

## Branch Naming

| Prefix       | When to use                        |
|--------------|------------------------------------|
| `feature/`   | New feature or enhancement         |
| `fix/`       | Bug fix                            |
| `docs/`      | Documentation only                 |
| `chore/`     | Config, deps, tooling changes      |

## Notes

- Never commit `.env` files or API keys.
- Keep PRs focused — one feature or fix per PR.
- If you're unsure about an approach, open an Issue first to discuss.

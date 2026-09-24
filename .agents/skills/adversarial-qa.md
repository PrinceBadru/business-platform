# Adversarial QA

Use this skill to challenge an implementation for edge cases, misuse, security regressions, and unexpected business behavior.

## Attack surface review

- Try invalid inputs, oversized payloads, and boundary conditions.
- Test authorization bypass attempts and data leakage scenarios.
- Check for missing validation, inconsistent error handling, and race conditions.
- Review user flows for destructive or irreversible actions.

## Questions to answer

- What breaks if the user tampers with state?
- What happens when an API response is missing or partial?
- What evidence is available for audit and debugging?
- Can a normal user access or mutate protected data?

## Exit criteria

The implementation should withstand the obvious misuse patterns and present clear, intentional, non-leaky error behavior.

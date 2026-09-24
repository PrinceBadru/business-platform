# Architecture Review

Use this skill when checking whether a feature or refactor fits the intended system design and module boundaries.

## Questions to ask

- Does the change align with the existing domain boundaries?
- Are new responsibilities being introduced into the wrong layer?
- Is the code coupling UI concerns to domain logic or storage logic?
- Are there hidden dependencies or shared state paths?

## Review checklist

- Confirm the feature is placed in the correct module.
- Validate the dependency flow is top-down and intentional.
- Ensure interfaces remain narrow and explicit.
- Confirm the change is testable and observable.

## Output expectation

Provide a concise architecture summary with:

- proposed design intent,
- risks or boundary violations,
- required refactors, and
- recommended follow-up tests.

# Secure Auth

Use this skill for access-control design, identity flows, session handling, and security-sensitive feature changes.

## Mandatory principles

- Never trust client-side authorization alone.
- Validate tokens and access decisions in the server context.
- Enforce least privilege at every boundary.
- Fail closed on ambiguous permission states.

## Checkpoints

- Confirm authentication sources and provider configuration.
- Verify session lifetime, refresh strategy, and secure cookies.
- Review role and permission mappings.
- Inspect data access paths for unauthorized flow possibilities.

## Output

Document the auth model, permission matrix, and any exceptions or assumptions that need explicit operational awareness.

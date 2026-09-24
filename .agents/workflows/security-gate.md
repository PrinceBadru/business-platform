# Security Gate

Use this workflow before merging or releasing a change with user impact.

## Gate questions

- Are auth and authorization enforced on the server side?
- Are data access boundaries and tenant isolation protected?
- Are secrets and environment variables handled safely?
- Are destructive or privileged operations isolated and auditable?

## Required result

Any security concern must be resolved or explicitly documented with an owner and mitigation plan before proceeding.

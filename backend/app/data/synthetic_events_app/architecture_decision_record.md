# Architecture Decision Record (ADR): Campus Events App Backend

## ADR 01: Authentication Strategy
- **Status**: Approved
- **Date**: 18 September 2026
- **Decision**: Use Firebase Auth for authentication instead of building a custom JWT/OAuth2 service.
- **Reasoning**: We need to launch before the annual college cultural fest. Firebase Auth gives us Google OAuth, phone authentication, and session handling out of the box with zero maintenance overhead.
- **Alternatives Considered & Rejected**: Custom FastAPI OAuth2 password bearer flow was evaluated by Alex Rivera and rejected because of high maintenance and security liabilities for student accounts.
- **Key Contacts**: Alex Rivera (Backend Lead), Maya Lin (Frontend Lead).

## ADR 02: Primary Database & State Handling
- **Status**: Approved
- **Date**: 22 August 2026
- **Decision**: PostgreSQL with Redis for caching ticket seat locks.
- **Reasoning**: Relational integrity is essential for ticket reservations and payments.
- **Known Risks**: High concurrency during ticket drops can cause connection pool exhaustion if Redis lock timeout is misconfigured.

## Critical Infrastructure Notes
- Secrets and environment variables are managed via Google Secret Manager.
- Database backups run daily at 02:00 UTC via Cloud SQL automated backups.
- Note: Production webhook signing secrets must be rotated every semester by the designated payment gateway owner.


# Week 4 : Live Market Integration, SRS & Architecture Documentation

Worked on integrating external financial feeds into InvestCircle, along with documenting the system specifications and architecture for the project review.

Researched and integrated the Finnhub Market News API (`/api/news/live`). Finnhub has strict rate limits on free-tier keys, so I implemented an in-memory TTL cache (5-minute cache window) on the server to prevent exhausting our quota while ensuring all users on the Discussions and News Reel screens get fresh market updates without lagging.

Spent significant time on the project documentation:
- Authored the core sections of the Software Requirements Specification (SRS), formalizing functional requirements, use cases, and non-functional guarantees like session persistence and sub-second query response times.
- Updated the system architecture document and UML diagrams (ER diagram, request lifecycle, and deployment topology).
- Outlined data flow models for user sentiment evaluation and price tracking for upcoming phases.

Also maintained the deployment environment across Vercel and Render, ensuring SSL enforcement for our Neon PostgreSQL cluster and verifying database connection pooling behavior under load.

Next: implement Phase 5 — building the AI-powered hit-rate accuracy engine for user discussions.

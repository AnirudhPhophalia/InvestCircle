# InvestCircle

InvestCircle is a peer-to-peer stock research and community platform designed to make financial discussions more structured, transparent, and accountable.

## Overview

Users can create profiles, publish stock research, follow other contributors, maintain watchlists, participate in discussions, and create structured stock calls.

A stock call contains:

- Stock ticker
- Bullish or bearish direction
- Target price
- Time horizon

Once the specified time horizon expires, the system retrieves market-price data and evaluates whether the call was successful. The result is stored as part of the user's historical track record.

The platform is designed for financial research and discussion only. It does not execute trades or connect to brokerage accounts.

## Key Features

- User authentication and profiles
- Stock research posts
- Structured stock calls
- Automatic call resolution
- Contributor performance tracking
- Follow and unfollow system
- Comments and threaded replies
- Stock watchlists
- Personalized financial News Reel
- Notifications
- Search and discovery
- Optional sector and sentiment tagging
- Basic moderation

## Tech Stack

- Frontend: React
- Backend: Node.js
- Database: PostgreSQL
- Caching: Redis
- Authentication: JWT + bcrypt/Argon2
- External Services: Financial market-data APIs
- Testing: Unit, integration and frontend testing
- CI/CD: Git-based continuous integration and deployment

## Architecture

The system follows a layered architecture:

```text
React Frontend
      |
REST API
      |
Business Logic
      |
PostgreSQL + Redis
      |
External Financial APIs
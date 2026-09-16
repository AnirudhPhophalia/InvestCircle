# Week 3 : Frontend, Routing & Feature Ideation

Spent this stretch mostly on the frontend side. Built out the page structure in React and wired up all the routing with React Router — auth pages, discussions, news reel, portfolio — including the protected-route redirect so a logged-out user gets bounced to login instead of seeing a broken page.

As the app grew past the first few phases, the frontend folder was starting to get hard to navigate — everything flat under `pages/`/`components/`. Reorganized it into feature folders (`features/auth`, `features/discussions`, `features/news`, `features/portfolio`) with a `shared/` folder for the stuff genuinely used across more than one feature, so it's clearer where a given screen's code actually lives.

Did most of the feature ideation too — deciding what "give your voice" on the News Reel should actually let a user do (record a clip, tag it bullish/bearish, add a comment), the trust-tier glow rings on reactor avatars, and generally what each phase should cover before handing it off to be built.

Next: keep polishing the demo flow — mobile responsiveness and persistence are done, need to do a final pass before presentation day.

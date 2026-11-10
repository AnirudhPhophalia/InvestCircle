# Week 4 : News–Company Mapping, News Reel UI & Profiles

1. **Mapping each news story to a company** — Live news from Finnhub is now sent to an LLM (via OpenRouter), which picks the company most affected by the story plus a few that are secondarily affected. The Company Fundamentals panel then shows real Finnhub market data for that company instead of the old hard-coded numbers. Picking a secondary company from the dropdown fetches its data on demand. The ticker is checked against Finnhub before anything is shown, so a wrong guess never displays another company's numbers.

2. **Fixing the News Reel UI** — The reel now waits for the live feed and shows a blinking "finding the most related company…" message while it loads, instead of flashing demo data first. The "gave their voice" reactions were redesigned as tall poster-style cards that slide in left to right, lift slightly on hover and show a quote of what the person said on the cover.

3. **Profile photo editing and profile links** — My Portfolio now has an add/edit photo option on hover (the image is cropped and resized in the browser and validated on the server). Every user's name across Discussions, comments, replies and voice reactions is now a link to their public profile. That page shows their posts, participation and a Get Accuracy button, but not their portfolio or email.

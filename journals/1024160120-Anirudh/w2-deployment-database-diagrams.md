# Week 2 : Deployment, Database & Diagrams

Handled getting the app off local machines and onto the internet. Set up hosting for both halves and worked through the environment config each platform needed — connection strings, CORS origin, cookie settings — so a login that works on localhost also works on the deployed URL.

The database needed to move off SQLite for this to work properly on a hosted platform, so I worked on migrating it over to PostgreSQL — schema, queries, and the seed script all had to be adjusted for it.

Also put together the diagrams and flowcharts we're using in the docs — the request-flow diagram, the database's table relationships, and the deployment diagram showing how the frontend and backend fit into one hosted project.

Next: keep an eye on the deployed build as the rest of the team keeps shipping features, and disable whatever hosting we're no longer using once we've settled on one setup.

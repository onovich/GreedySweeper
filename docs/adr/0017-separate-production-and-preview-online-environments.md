# Separate production and preview online environments

The production Worker and WebSocket endpoint will use `greedysweeper-api.onovich.com`, while the web client remains at `https://blog.onovich.com/GreedySweeper/`; preview deployments use a separate `workers.dev` endpoint and independent Durable Object namespaces, secrets, storage, and rate-limit configuration. The API endpoint is injected at build time, and production only permits the deployed web origin.

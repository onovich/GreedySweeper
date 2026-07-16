# Deploy a backward-compatible Worker before the web client

Production releases validate in an isolated preview environment, apply forward-only additive Durable Object migrations, deploy a Worker compatible with the current and previous Online Protocol Versions, verify the existing web client, and only then deploy GitHub Pages with manual approval. Simultaneous incompatible releases and destructive migrations were rejected because cached clients and one-hour room lifetimes require independent rollback; failures disable new room creation while existing rooms finish or expire.

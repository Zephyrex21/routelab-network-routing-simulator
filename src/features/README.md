# Feature Modules

Keep user interactions and screen-specific state inside their owning feature. Reusable presentation primitives belong in `src/components`; graph and routing algorithm domain logic belongs in `src/engine`. Packet forwarding validation lives in `packet-explorer/model`; isolated topology variants and before/after outcome classification live in `network-failure/model`. These models must remain independent of React components.

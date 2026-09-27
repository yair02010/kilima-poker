# ADR-0012: Kubernetes on AWS Cape Town with an EU disaster-recovery region

**Status:** Accepted · **Date:** September 2026 · **Deciders:** CTO, SRE

## Context

Players are in Africa; latency matters for real-time play. The platform needs managed data services, strong security tooling and a credible DR plan. Render (Bridge Alpha choice) lacks regional presence and controls needed for Real Money.

## Decision

Run on Amazon EKS in `af-south-1` (Cape Town) with multi-AZ managed data stores, a warm standby in an EU region, a CDN with African points of presence terminating TLS and proxying WebSockets, Terraform and Argo CD. Where a licence requires in-country hosting or data replication, add a regulatory node in that country.

## Consequences

- Lowest practical latency for most launch markets; mature managed services.
- Higher operational skill required (SRE team from Alpha).
- Some West African markets may see higher RTT to Cape Town; monitored, with an option for an additional region later.

## Alternatives considered

Render/Heroku-style PaaS (limits for Real Money); EU-only hosting (higher latency); multi-cloud from day one (complexity).

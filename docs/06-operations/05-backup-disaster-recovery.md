---
id: KP-OPS-05
title: Backup and Disaster Recovery
subtitle: What is backed up, restore procedures, region failover and drills
version: 1.0
owner: SRE Lead
status: Draft
related: KP-ENG-10 NFR (RPO/RTO) · KP-OPS-03 Runbooks · KP-QA-04 §6 DR Drills · KP-LEG-06 Data Retention
---

# 1. Recovery Targets (Real Money)

@widths 1.6,1.1,1.1,1.2
| Data / service | RPO | RTO (region loss) | Mechanism |
|---|---|---|---|
| Ledger and cashier | 0 in region; ≤ 1 min cross-region | 1 h (GA) | Aurora multi-AZ synchronous; Aurora Global Database to EU standby |
| Core data (identity, tournaments, compliance) | 0 in region; ≤ 1 min cross-region | 1 h | Same |
| Completed hands | 0 (in ledger + Kafka + ClickHouse) | 4 h for analytics | Kafka replication + S3 archive |
| Live hands | Not recovered (voided) | — | By design (KP-ENG-08 §5.4) |
| Redis | Not a system of record | 15 min | Rebuilt from ledger and snapshots |
| Audit and RNG logs | 0 | — | S3 Object Lock with cross-region replication |

# 2. Backups

@widths 1.5,1.8,1.7
| Item | Backup | Retention |
|---|---|---|
| PostgreSQL clusters | Continuous PITR (35 days) + daily snapshots copied to a separate backup account and region | Daily 35 d, monthly 13 months, yearly per licence |
| ClickHouse | Daily backups to S3; rebuildable from Kafka archive and S3 lake | 35 days |
| S3 archives | Versioning + Object Lock + replication | Per KP-LEG-06 |
| Kafka | Replication factor 3; archived topics to S3 | Per topic |
| Configuration | Git (IaC, Helm, exported business config) | Permanent |
| Secrets | Secrets Manager replication to DR region | — |

Backups are encrypted with keys in the backup account; restore permissions are separate from production operator permissions (ransomware protection).

# 3. Restore Procedures

## 3.1 Point-in-time restore (logical error, e.g. bad migration)

1. Stop writers to the affected schema (pause tables/cashier if ledger).
2. Restore PITR to a new cluster at the timestamp before the error.
3. Compare and extract correct data; apply corrections through normal code paths (reversals for the ledger); never overwrite the live ledger.
4. Reconcile; resume.

## 3.2 Full region failure

1. IC declares DR (CTO approval); Real Money tables are already stopped (region down); Play Money may stay down longer.
2. Promote the Aurora Global secondary in the EU region; scale up the standby EKS cluster (pre-provisioned at minimum size) through Argo CD.
3. Switch the CDN origin to the standby region; clients reconnect.
4. Before reopening Real Money: run ledger invariants and reconciliation on the promoted database; verify RNG pods healthy; regulator notification per licence.
5. Reopen with reduced capacity; hands that were in progress at failure are voided (stacks from the ledger).
6. Plan fail-back after the primary region is healthy (controlled, during low traffic).

Data residency: if a licence requires player data to stay in a country or region, the DR plan for that jurisdiction uses an approved location (documented in the jurisdiction matrix).

# 4. Drills

@widths 1.8,1.2,2
| Drill | Frequency | Success criteria |
|---|---|---|
| PITR restore of ledger into isolated environment | Monthly | Restore < 1 h; invariants pass |
| Region failover (staging, full) | Quarterly | RTO/RPO targets met |
| Region failover (production, Play Money) | Twice a year | Players back within RTO |
| Backup integrity sample restore | Weekly (automated) | Checksums and row counts match |
| Tabletop (ransomware, provider compromise) | Twice a year | Actions and owners clear; gaps tracked |

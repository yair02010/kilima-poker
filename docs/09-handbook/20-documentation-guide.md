---
id: KP-HBK-20
title: Documentation Guide
subtitle: How to write and change dossier documents, ADRs and this site
version: 1.0
owner: Programme Director
status: Approved
related: KP-GOV-01 Document Management · KP-ENG-12 ADR Log
---

# 1. Where Knowledge Goes

@widths 1.8,3.2
| Kind | Place |
|---|---|
| What we build and why (requirements, specs, policies) | Dossier documents (KP-GOV … KP-FIN) |
| How we work (processes, guides) | This handbook (KP-HBK) |
| A decision with alternatives | ADR |
| A proposal under discussion | RFC (`docs/rfcs`) |
| How to run one service | Service README and RUNBOOK |
| API facts | `specs/` (generated), never copied into prose tables by hand without the consistency check |

# 2. Writing Style

Plain English for an international team: short sentences, active voice, one idea per paragraph, tables for comparisons, numbered steps for procedures. Define terms in the glossary. Money examples use integer minor units or clearly labelled currency amounts.

# 3. Markdown Dialect (renders to PDF and site)

@widths 1.8,3.2
| Syntax | Result |
|---|---|
| Front matter (`id`, `title`, `subtitle`, `version`, `owner`, `status`, `related`, `banner`) | Cover, control table, site header |
| `# 1. Section` / `## Sub` / `### Minor` | Headings (H1 feeds the table of contents) |
| `@widths 1,2,3` above a table | Column proportions (must match column count) |
| `> text` | Information callout |
| `!> text` | Warning callout |
| `- [ ] item` | Checklist |
| `@diagram arch` | Architecture diagram |
| `@include adr` | Includes all ADR files (ADR log) |
| A code fence with the language `mermaid` | Diagram on the site (PDF shows the source) |

# 4. Commands

```
python3 tools/check_references.py     # IDs and @widths
python3 tools/make_index.py           # index + README
python3 tools/build.py 09-handbook    # PDFs
python3 tools/build_site.py           # this documentation site
```

# 5. Keeping Docs Alive

Every PR that changes behaviour updates the relevant document in the same PR. Each document owner reviews their documents at every gate. Stale documents are worse than none: if something is obsolete, mark it `Superseded` with a link.

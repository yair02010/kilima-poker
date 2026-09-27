# ADR-0004: Phone-first identity with OTP and step-up verification

**Status:** Accepted · **Date:** September 2026 · **Deciders:** Product Owner, Tech Lead Platform

## Context

In launch markets, phone numbers are universal and tied to mobile money; email use is lower. Real money accounts need strong protection against SIM swap, credential stuffing and account takeover.

## Decision

Register and log in with phone number + password (+ passkey where available); OTP by SMS or WhatsApp at registration and on new devices; step-up for every money and security action; TOTP and passkeys as stronger factors; staff use SSO with hardware keys.

## Consequences

- Low-friction onboarding matching local habits.
- SMS cost and SMS-pumping risk; mitigated by budgets, WhatsApp channel and fraud controls.
- SIM-swap checks needed where operators provide them.

## Alternatives considered

Email-first with email 2FA (Bridge Casino ADR-0010) — poor fit for the market; password only — too weak.

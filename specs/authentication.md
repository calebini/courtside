# Courtside Authentication Delivery

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-07

## Purpose

This specification defines the initial login, session-verification, and League Administrator bootstrap delivery boundary. It does not grant domain authority through Supabase Auth and does not collapse a login identity into a User Account or Player.

## Initial Login Method

The initial user-facing login method is email and password through Supabase Auth. Public self-sign-up is disabled. Password reset, invitations, social login, passkeys, and multi-factor authentication are deferred until their complete user and operational flows are specified and tested.

Local development may contain a clearly identified disposable Auth user and matching Courtside fixtures. Local credentials must not be reused outside the local Supabase stack and must never be treated as a production bootstrap mechanism.

## Session Verification

Every authenticated server-rendered page and Server Action verifies the current identity with Supabase Auth. Cookie contents or an unverified local session payload are not sufficient proof of identity. Authentication failure redirects interactive requests to the localized sign-in page without attempting a domain read or mutation.

The verified Supabase user identifier maps to at most one persistent Courtside User Account through `external_auth_id`. Email addresses and authentication-provider metadata are not domain authorization claims.

## Authorization

Every authoritative mutation resolves the verified external identity to its Courtside User Account and evaluates current scoped assignments from PostgreSQL at request time. The browser never supplies the actor User Account identifier, and a previously rendered administrator page does not prove continuing authority.

An authenticated User Account without an active League Administrator assignment may sign in but receives no League Administrator data or mutation capability. Domain-table reads and writes remain server-mediated; Supabase `anon` and `authenticated` database roles receive no direct access to authoritative Courtside tables in this slice.

## Initial Administrator Bootstrap

Production bootstrap is an explicit, controlled operational action that creates or selects the first User Account and establishes the first League Administrator assignment in one server-side transaction. It is allowed only while the target League has no League Administrator assignment history, is serialized per League, and writes an Audit Record. Retrying identical bootstrap content reuses the accepted result; conflicting or post-bootstrap attempts are rejected without mutation.

The production bootstrap command and operator runbook are deferred and authentication must not be released to production until they exist. The local development fixture is not the production bootstrap command. After bootstrap, all administrator assignment changes follow the accepted domain lifecycle and final-active-administrator protection.

## Secure Mutation Delivery

Game scheduling, rescheduling, postponement, cancellation, start, and finalization are delivered through Next.js Server Actions. The actions accept only target references and requested changes from the browser, use server-generated command identities rendered with each form, derive the actor from the verified session, and invoke application services. Application services and PostgreSQL transactions remain the authority for scoped authorization, lifecycle validation, idempotency, scheduling history, configuration freezing, auditing, and standings recomputation.

Invalid input, authentication failure, authorization failure, and infrastructure failure must not leak credentials, raw database errors, or sensitive identity details to the browser.

## Deferred Surface

This slice does not release production authentication, implement invitations or recovery, create the production bootstrap command, expose public sign-up, grant direct browser access to domain tables, or change Team Captain and Player Management authority.

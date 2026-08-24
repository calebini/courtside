# Courtside Authentication Delivery

- Status: accepted
- Spec version: 0.4.0
- Last updated: 2026-08-24

## Purpose

This specification defines registration, login, recovery, session verification, User Account provisioning, and the League Administrator bootstrap boundary. It does not grant domain authority through Supabase Auth and does not collapse a login identity into a User Account or Player.

## Login and Registration

The initial user-facing login method is email and password through Supabase Auth. A deployment configuration selects `open` or `closed` registration; missing or unknown configuration fails closed. The local demo selects open registration. Open registration creates authentication identity only and does not grant Player, Team, Season, or League authority.

Registration requires display name, email, language preference, and a password of 8 through 128 characters containing at least one letter and one digit. Supabase owns credentials, confirmation tokens, password policy enforcement, authentication rate limits, and recovery tokens. Courtside does not persist passwords or provider tokens.

The initial production posture is email confirmation before account provisioning. A successful registration that has no confirmed session renders the same check-email outcome whether the email is new or already registered. A later League-code or invitation policy may replace open registration without changing User Account or Player Management identities.

Local development may contain a clearly identified disposable Auth user and matching Courtside fixtures. Local credentials must not be reused outside the local Supabase stack and must never be treated as a production bootstrap mechanism.

## Session Verification

Every authenticated server-rendered page and Server Action verifies the current identity with Supabase Auth. Cookie contents or an unverified local session payload are not sufficient proof of identity. Authentication failure redirects interactive requests to the localized sign-in page without attempting a domain read or mutation.

The verified Supabase user identifier maps to at most one persistent Courtside User Account through `external_auth_id`. Email addresses and authentication-provider metadata are not domain authorization claims.

## User Account Provisioning

Provisioning is a server-side, idempotent operation following successful registration confirmation, authentication callback, or sign-in. It requires a Supabase identity verified by `getUser`, a confirmed email address, and a valid display name. It creates at most one independent Courtside User Account for `external_auth_id`, stores the normalized contact email for authorized administrator review, and stores English or French as the User Account language preference.

Repeated provisioning reuses the existing User Account, synchronizes its verified contact email and the explicitly selected supported language, and does not overwrite its Courtside display name. Provisioning does not create a Player or any Player Management Relationship. A newly provisioned Account must use the request-and-approval workflow in `specs/player-management.md`.

An authenticated but unprovisionable identity is signed out and receives a generic account-preparation failure. Server Components may resolve Accounts but do not provision them as a rendering side effect.

## Password Recovery

Password recovery accepts an email and always returns the same check-email response for invalid syntax, an unknown account, provider rejection, and an accepted request. Recovery links return through a fixed configured Courtside site origin and an allowlisted localized destination. The callback exchanges the single-use provider code for a verified server session; arbitrary `next` destinations are rejected.

Updating a password requires both the verified provider session created by the recovery callback and
a Courtside recovery authorization. The callback creates a cryptographically random authorization,
stores only its hash, binds it to the verified external identity, expires it after fifteen minutes,
and delivers the opaque value in an HttpOnly same-site cookie. The update atomically consumes that
authorization before one provider password mutation, then signs out. Ordinary authenticated
sessions, missing or mismatched cookies, expired authorizations, and replayed authorizations return
to sign-in without revealing account existence or provider details. A provider failure after
consumption requires a new recovery request.

## Authorization

Every authoritative mutation resolves the verified external identity to its Courtside User Account and evaluates current scoped assignments from PostgreSQL at request time. The browser never supplies the actor User Account identifier, and a previously rendered administrator page does not prove continuing authority.

An authenticated User Account without an active League Administrator assignment may sign in but receives no League Administrator data or mutation capability. Domain-table reads and writes remain server-mediated; Supabase `anon` and `authenticated` database roles receive no direct access to authoritative Courtside tables in this slice.

## Initial Administrator Bootstrap

Initial bootstrap is an explicit, controlled operational action that selects an already provisioned User Account by its normalized verified contact email and establishes the first League Administrator assignment in one server-side transaction. The action creates the initial League when the deployment contains none, or selects the sole existing League only when its name, IANA timezone, and default language exactly match the requested configuration. A deployment containing multiple Leagues is outside this initial command's scope.

The command is allowed only while the selected League has no League Administrator assignment history. A deployment-wide transaction lock serializes attempts before a League necessarily exists. The accepted transaction creates the League when required, creates the assignment, writes an Audit Record, and stores a Command Receipt. Retrying identical normalized bootstrap content reuses the accepted result even when the operator supplies a new command identity. Reusing a command identity for different content, changing accepted content, or attempting bootstrap after any administrator assignment history exists is rejected without mutation.

The delivered operator command is staging-only, uses the Supabase transaction pooler, verifies that an explicitly confirmed project reference matches the database connection, and performs a read-only plan unless the operator also supplies `--apply`. It does not create a Season, Team, Player, or Auth identity. Those records require separate deliberate setup. The local development fixture is not this bootstrap command. After bootstrap, all administrator assignment changes follow the accepted domain lifecycle and final-active-administrator protection. A production bootstrap remains blocked until this control is deliberately extended and exercised for a production target.

## Secure Mutation Delivery

Game scheduling, rescheduling, postponement, cancellation, start, finalization, forfeiture, and authoritative result correction are delivered through Next.js Server Actions. The actions accept only target references and requested changes from the browser, use server-generated command identities rendered with each form, derive the actor from the verified session, and invoke application services. Application services and PostgreSQL transactions remain the authority for scoped authorization, lifecycle validation, idempotency, scheduling history, configuration freezing, auditing, and standings recomputation.

Invalid input, authentication failure, authorization failure, and infrastructure failure must not leak credentials, raw database errors, or sensitive identity details to the browser.

## Deployment Requirements

Production release requires an explicit site URL, explicit registration mode, working transactional email provider, email confirmation, Supabase authentication rate limits, CAPTCHA or an equivalent abuse control for open registration, and an exercised confirmation and recovery runbook. Local Inbucket delivery is disposable development infrastructure rather than production email.

## Deferred Surface

This slice does not release production authentication, implement invitations, League codes, social login, passkeys, multi-factor authentication, authorize the bootstrap command for production, create Season or Team setup automation, grant direct browser access to domain tables, or change Team Captain and Player Management authority.

# Courtside Operations

## Staging Initial Administrator Bootstrap

Use this command once, after the intended administrator has registered, confirmed their email, and signed in at least once so Courtside has provisioned the corresponding User Account. The command does not create an Auth identity, Season, Team, or Player.

The command accepts only a Supabase transaction-pooler `DATABASE_URL` on port `6543`. It compares the project reference embedded in that URL with the separately supplied confirmation value and refuses any environment other than `staging`. It never prints the connection string. Keep the password out of the URL and provide it through PostgreSQL's standard `PGPASSWORD` environment variable.

In a private terminal session, prompt for the database password without echoing it or placing it in shell history:

```sh
read -s 'PGPASSWORD?Supabase database password: '
export PGPASSWORD
```

First run a read-only plan. The password-free transaction-pooler URL is safe to retain in shell history:

```sh
DATABASE_URL='postgresql://postgres.<project-ref>@<pooler-host>:6543/postgres' \
npm run bootstrap:staging -- \
  --environment staging \
  --confirm-project-ref '<staging Supabase project reference>' \
  --admin-email '<registered administrator email>' \
  --league-name '<exact League name>' \
  --timezone Europe/Paris \
  --default-language en
```

Review all returned fields. `mode` must be `plan`, `status` must be `planned`, the project reference must be the staging project, the administrator Account identifier must be populated, and `league.willCreate` must match the expected database state. A plan writes no League, assignment, audit, or receipt records.

Apply only by repeating the reviewed command with `--apply`:

```sh
DATABASE_URL='postgresql://postgres.<project-ref>@<pooler-host>:6543/postgres' \
npm run bootstrap:staging -- \
  --environment staging \
  --confirm-project-ref '<staging Supabase project reference>' \
  --admin-email '<registered administrator email>' \
  --league-name '<exact League name>' \
  --timezone Europe/Paris \
  --default-language en \
  --apply
```

Remove the password from the terminal environment afterward:

```sh
unset PGPASSWORD
```

A successful first application returns `status: "created"` plus League, assignment, and Audit Record identifiers. Repeating identical content returns `status: "reused"` and creates nothing else. Any conflicting or post-bootstrap request fails. Do not work around a failure with manual database inserts; inspect the target and input, then either correct an unapplied plan or make a new accepted operational decision.

Do not place `PGPASSWORD` or a password-bearing connection string in command history, screenshots, committed files, issue trackers, or chat messages. Prefer the non-echoing prompt above or an approved secret-injection mechanism when running the real command.

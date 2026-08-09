alter table user_accounts
  add column contact_email text,
  add column preferred_locale text not null default 'en'
    check (preferred_locale in ('en', 'fr')),
  add constraint user_accounts_contact_email_not_blank
    check (contact_email is null or btrim(contact_email) <> '');

update user_accounts ua
   set contact_email = lower(au.email)
  from auth.users au
 where au.id = ua.external_auth_id
   and au.email is not null;

'use server';

import {redirect} from 'next/navigation';

import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';

function supportedLocale(value: FormDataEntryValue | null) {
  return value === 'fr' ? 'fr' : 'en';
}

export async function signIn(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect(`/${locale}/sign-in?error=invalid`);
  }

  const supabase = await createSupabaseServerClient();
  const {error} = await supabase.auth.signInWithPassword({email, password});
  if (error) {
    redirect(`/${locale}/sign-in?error=invalid`);
  }

  redirect(`/${locale}/admin`);
}

export async function signOut(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/sign-in`);
}

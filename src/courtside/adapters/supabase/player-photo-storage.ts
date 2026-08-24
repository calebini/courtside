import 'server-only';

import {createClient, type SupabaseClient} from '@supabase/supabase-js';

import type {ProfilePhotoType} from '@/courtside/core/player-profile';
import type {PlayerPhotoStorage} from '@/courtside/services/manage-player-photo';

const BUCKET = 'player-profile-photos';
const LIST_PAGE_SIZE = 100;
const MAX_RECONCILED_OBJECTS = 1000;

function createPrivilegedSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Server-mediated profile photos require Supabase URL and service-role credentials');
  }
  return createClient(url, serviceRoleKey, {
    auth: {autoRefreshToken: false, detectSessionInUrl: false, persistSession: false}
  });
}

export class SupabasePlayerPhotoStorage implements PlayerPhotoStorage {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient = createPrivilegedSupabaseClient()) {
    this.client = client;
  }

  async upload(input: {objectKey: string; bytes: Uint8Array; contentType: ProfilePhotoType}) {
    const result = await this.client.storage.from(BUCKET).upload(input.objectKey, input.bytes, {
      contentType: input.contentType,
      upsert: false
    });
    if (result.error) throw result.error;
  }

  async createSignedUrl(objectKey: string, expiresInSeconds: number) {
    const result = await this.client.storage.from(BUCKET).createSignedUrl(objectKey, expiresInSeconds);
    if (result.error) throw result.error;
    return result.data.signedUrl;
  }

  async removeObject(objectKey: string) {
    const result = await this.client.storage.from(BUCKET).remove([objectKey]);
    if (result.error) throw result.error;
  }

  async removePlayerObjectsExcept(playerId: string, retainedObjectKey: string | null) {
    const removable: string[] = [];
    for (let offset = 0; offset < MAX_RECONCILED_OBJECTS; offset += LIST_PAGE_SIZE) {
      const result = await this.client.storage.from(BUCKET).list(playerId, {
        limit: LIST_PAGE_SIZE,
        offset,
        sortBy: {column: 'name', order: 'asc'}
      });
      if (result.error) throw result.error;
      for (const object of result.data) {
        const objectKey = `${playerId}/${object.name}`;
        if (objectKey !== retainedObjectKey) removable.push(objectKey);
      }
      if (result.data.length < LIST_PAGE_SIZE) break;
    }
    if (removable.length === 0) return;
    const result = await this.client.storage.from(BUCKET).remove(removable);
    if (result.error) throw result.error;
  }
}

/**
 * Supabase client.
 * Reads URL + anon key from Vite env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 * If env vars are missing, all functions return null/empty and app falls back
 * to local-only mode (LocalStorage profile, no remote leaderboard).
 */

import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { UserProfile, LeaderboardEntry } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  } catch (e) {
    console.warn('[Supabase] Failed to init client', e)
  }
}

export function isSupabaseEnabled(): boolean {
  return !!client
}

export function getClient(): SupabaseClient | null {
  return client
}

export interface RoomRow {
  id: string
  fen: string
  pgn: string
  turn: 'w' | 'b'
  white_player: string | null
  black_player: string | null
  created_at?: string
  updated_at?: string
}

// ─── Auth ─────────────────────────────────────────────────────
export async function signInWithEmail(email: string, password: string) {
  if (!client) throw new Error('Supabase not configured')
  return client.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string, username: string) {
  if (!client) throw new Error('Supabase not configured')
  return client.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })
}

export async function signInAnon(username: string) {
  if (!client) throw new Error('Supabase not configured')
  return client.auth.signInAnonymously({ options: { data: { username } } })
}

export async function signOut() {
  if (!client) return
  await client.auth.signOut()
}

export async function getCurrentUser() {
  if (!client) return null
  const { data } = await client.auth.getUser()
  return data.user
}

// ─── Profile ──────────────────────────────────────────────────
export async function getProfile(userId: string): Promise<UserProfile | null> {
  if (!client) return null
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return null
  return mapDbProfile(data)
}

export async function upsertProfile(profile: Partial<UserProfile> & { id: string }) {
  if (!client) return
  const dbRow = {
    id: profile.id,
    username: profile.username,
    city: profile.city,
    elo: profile.elo,
    games_played: profile.gamesPlayed,
    wins: profile.wins,
    losses: profile.losses,
    draws: profile.draws,
    is_pro: profile.isPro,
  }
  await client.from('profiles').upsert(dbRow)
}

export async function recordGameResult(
  userId: string,
  result: 'win' | 'loss' | 'draw',
  opponentElo = 1200,
) {
  const profile = await getProfile(userId)
  if (!profile) return
  const k = 32
  const expected = 1 / (1 + Math.pow(10, (opponentElo - profile.elo) / 400))
  const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0
  const newElo = Math.round(profile.elo + k * (score - expected))
  await upsertProfile({
    id: userId,
    elo: newElo,
    gamesPlayed: profile.gamesPlayed + 1,
    wins: profile.wins + (result === 'win' ? 1 : 0),
    losses: profile.losses + (result === 'loss' ? 1 : 0),
    draws: profile.draws + (result === 'draw' ? 1 : 0),
  })
}

// ─── Leaderboard ──────────────────────────────────────────────
export async function getGlobalLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  if (!client) return []
  const { data, error } = await client
    .from('profiles')
    .select('username, city, elo, wins, is_pro')
    .order('elo', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map(mapDbLeaderEntry)
}

export async function getCityLeaderboard(city: string, limit = 50): Promise<LeaderboardEntry[]> {
  if (!client) return []
  const { data, error } = await client
    .from('profiles')
    .select('username, city, elo, wins, is_pro')
    .eq('city', city)
    .order('elo', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map(mapDbLeaderEntry)
}

export async function getCities(): Promise<string[]> {
  if (!client) return []
  const { data, error } = await client
    .from('profiles')
    .select('city')
    .not('city', 'is', null)
  if (error || !data) return []
  const set = new Set<string>()
  data.forEach((r) => r.city && set.add(r.city))
  return Array.from(set).sort()
}

// ─── Rooms / Realtime multiplayer ───────────────────────────────
export async function createRoom(row: RoomRow): Promise<RoomRow> {
  if (!client) throw new Error('Supabase not configured')
  const { data, error } = await client
    .from('rooms')
    .insert(row)
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message || 'Failed to create room')
  return data as RoomRow
}

export async function getRoom(roomId: string): Promise<RoomRow | null> {
  if (!client) throw new Error('Supabase not configured')
  const { data, error } = await client
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as RoomRow | null) ?? null
}

export async function claimBlackSeat(roomId: string, playerId: string): Promise<boolean> {
  if (!client) throw new Error('Supabase not configured')
  const { data, error } = await client
    .from('rooms')
    .update({ black_player: playerId })
    .eq('id', roomId)
    .is('black_player', null)
    .select('id')
  if (error) throw new Error(error.message)
  return Array.isArray(data) && data.length > 0
}

export async function updateRoomState(
  roomId: string,
  payload: Pick<RoomRow, 'fen' | 'pgn' | 'turn'>
): Promise<RoomRow> {
  if (!client) throw new Error('Supabase not configured')
  const { data, error } = await client
    .from('rooms')
    .update(payload)
    .eq('id', roomId)
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message || 'Failed to update room')
  return data as RoomRow
}

export function subscribeRoomUpdates(
  roomId: string,
  onRoomUpdate: (room: RoomRow) => void,
  onStatus?: (status: 'connected' | 'syncing' | 'error') => void
): RealtimeChannel {
  if (!client) throw new Error('Supabase not configured')
  const channel = client
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      (payload) => onRoomUpdate(payload.new as RoomRow)
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') onStatus?.('connected')
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onStatus?.('error')
      else onStatus?.('syncing')
    })
  return channel
}

export function unsubscribeRoom(channel: RealtimeChannel | null | undefined) {
  if (!client || !channel) return
  client.removeChannel(channel)
}

// ─── Helpers ──────────────────────────────────────────────────
function mapDbProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    username: (row.username as string) ?? 'Player',
    city: (row.city as string) ?? '',
    elo: (row.elo as number) ?? 1200,
    gamesPlayed: (row.games_played as number) ?? 0,
    wins: (row.wins as number) ?? 0,
    losses: (row.losses as number) ?? 0,
    draws: (row.draws as number) ?? 0,
    isPro: (row.is_pro as boolean) ?? false,
  }
}

function mapDbLeaderEntry(row: Record<string, unknown>): LeaderboardEntry {
  return {
    username: (row.username as string) ?? 'Player',
    city: (row.city as string) ?? '',
    elo: (row.elo as number) ?? 1200,
    wins: (row.wins as number) ?? 0,
    isPro: (row.is_pro as boolean) ?? false,
  }
}

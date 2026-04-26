import { SavedGame, AppTheme, PieceSkin, UserProfile } from '../types'

const GAMES_KEY = 'chessverse_saved_games'
const CURRENT_KEY = 'chessverse_current'
const THEME_KEY = 'chessverse_app_theme'
const SKIN_KEY = 'chessverse_piece_skin'
const SKINS_OWNED_KEY = 'chessverse_skins_owned'
const PROFILE_KEY = 'chessverse_profile'
const PRO_KEY = 'chessverse_is_pro'

export function getSavedGames(): SavedGame[] {
  try {
    return JSON.parse(localStorage.getItem(GAMES_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveGame(game: SavedGame): void {
  const games = getSavedGames()
  const idx = games.findIndex(g => g.id === game.id)
  if (idx >= 0) games[idx] = game
  else games.unshift(game)
  localStorage.setItem(GAMES_KEY, JSON.stringify(games.slice(0, 20)))
}

export function deleteGame(id: string): void {
  const games = getSavedGames().filter(g => g.id !== id)
  localStorage.setItem(GAMES_KEY, JSON.stringify(games))
}

export function saveCurrentFen(pgn: string): void {
  localStorage.setItem(CURRENT_KEY, pgn)
}

export function loadCurrentFen(): string | null {
  return localStorage.getItem(CURRENT_KEY)
}

// ─── App theme ──────────────────────────────────────────
export function getAppTheme(): AppTheme {
  const t = localStorage.getItem(THEME_KEY)
  return t === 'light' ? 'light' : 'dark'
}

export function saveAppTheme(theme: AppTheme): void {
  localStorage.setItem(THEME_KEY, theme)
}

// ─── Piece skins ────────────────────────────────────────
export function getPieceSkin(): PieceSkin {
  const s = localStorage.getItem(SKIN_KEY)
  if (s === 'gold' || s === 'marble' || s === 'neon') return s
  return 'classic'
}

export function savePieceSkin(skin: PieceSkin): void {
  localStorage.setItem(SKIN_KEY, skin)
}

export function getOwnedSkins(): PieceSkin[] {
  try {
    const s = JSON.parse(localStorage.getItem(SKINS_OWNED_KEY) || '["classic"]')
    return Array.isArray(s) ? s : ['classic']
  } catch {
    return ['classic']
  }
}

export function unlockSkin(skin: PieceSkin): void {
  const owned = getOwnedSkins()
  if (!owned.includes(skin)) {
    owned.push(skin)
    localStorage.setItem(SKINS_OWNED_KEY, JSON.stringify(owned))
  }
}

// ─── Profile ────────────────────────────────────────────
export function getProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY)
}

// ─── Pro status ─────────────────────────────────────────
export function isProUser(): boolean {
  return localStorage.getItem(PRO_KEY) === 'true'
}

export function setProUser(isPro: boolean): void {
  localStorage.setItem(PRO_KEY, isPro ? 'true' : 'false')
}

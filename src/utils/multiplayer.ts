/**
 * P2P multiplayer via PeerJS WebRTC.
 * One player creates a room and gets a share link.
 * The other opens the link and connects directly — no server.
 */

import Peer, { DataConnection } from 'peerjs'

export type MpMessage =
  | { type: 'hello'; username: string; color: 'w' | 'b' }
  | { type: 'move'; from: string; to: string; promotion?: string; pgn: string; fen: string }
  | { type: 'resign'; color: 'w' | 'b' }
  | { type: 'rematch-request' }
  | { type: 'rematch-accept' }
  | { type: 'chat'; text: string; from: string }

export interface MpHandlers {
  onConnect: () => void
  onDisconnect: () => void
  onMessage: (msg: MpMessage) => void
  onError: (err: string) => void
}

let peer: Peer | null = null
let conn: DataConnection | null = null
let myId: string | null = null
let handlers: MpHandlers | null = null

function makeRoomId(): string {
  // Short, readable, lowercase-only id (PeerJS doesn't accept all chars)
  const alpha = 'abcdefghjkmnpqrstuvwxyz23456789'
  let s = 'cv-'
  for (let i = 0; i < 8; i++) s += alpha[Math.floor(Math.random() * alpha.length)]
  return s
}

export function getRoomLink(roomId: string): string {
  const url = new URL(window.location.href)
  url.pathname = `/room/${roomId}`
  url.searchParams.delete('room')
  url.hash = ''
  return url.toString()
}

export function getRoomFromUrl(): string | null {
  try {
    const url = new URL(window.location.href)
    const pathMatch = url.pathname.match(/^\/room\/([^/]+)$/)
    if (pathMatch?.[1]) return pathMatch[1]
    return url.searchParams.get('room')
  } catch {
    return null
  }
}

function attachConn(c: DataConnection) {
  conn = c
  c.on('open', () => handlers?.onConnect())
  c.on('data', (data) => {
    try {
      const msg = (typeof data === 'string' ? JSON.parse(data) : data) as MpMessage
      handlers?.onMessage(msg)
    } catch {
      // ignore malformed
    }
  })
  c.on('close', () => handlers?.onDisconnect())
  c.on('error', (e) => handlers?.onError(e.message || 'Connection error'))
}

export function hostRoom(h: MpHandlers): Promise<string> {
  handlers = h
  return new Promise((resolve, reject) => {
    cleanup()
    const id = makeRoomId()
    try {
      peer = new Peer(id, { debug: 0 })
    } catch (e) {
      reject(e)
      return
    }
    peer.on('open', (assignedId) => {
      myId = assignedId
      resolve(assignedId)
    })
    peer.on('connection', (c) => {
      attachConn(c)
    })
    peer.on('error', (err) => {
      // Common: 'unavailable-id' if room id is in use — retry once
      if ((err as { type?: string }).type === 'unavailable-id') {
        cleanup()
        hostRoom(h).then(resolve).catch(reject)
        return
      }
      handlers?.onError(err.message || 'Peer error')
      reject(err)
    })
  })
}

export function joinRoom(roomId: string, h: MpHandlers): Promise<void> {
  handlers = h
  return new Promise((resolve, reject) => {
    cleanup()
    try {
      peer = new Peer({ debug: 0 })
    } catch (e) {
      reject(e)
      return
    }
    peer.on('open', (id) => {
      myId = id
      const c = peer!.connect(roomId, { reliable: true })
      attachConn(c)
      // The 'open' event on conn resolves
      c.on('open', () => resolve())
    })
    peer.on('error', (err) => {
      handlers?.onError(err.message || 'Peer error')
      reject(err)
    })
  })
}

export function send(msg: MpMessage): void {
  if (!conn || !conn.open) return
  conn.send(msg)
}

export function isConnected(): boolean {
  return !!(conn && conn.open)
}

export function getMyId(): string | null {
  return myId
}

export function cleanup(): void {
  try { conn?.close() } catch { /* ignore */ }
  try { peer?.destroy() } catch { /* ignore */ }
  conn = null
  peer = null
  myId = null
}

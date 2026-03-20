import cors from 'cors'
import express from 'express'
import fs from 'fs'
import { createServer } from 'http'
import path from 'path'
import {
  InMemorySyncStorage,
  RoomSnapshot,
  TLSocketRoom,
} from '@tldraw/sync-core'
import {
  createTLSchema,
  defaultBindingSchemas,
  defaultShapeSchemas,
  TLRecord,
  vecModelValidator,
} from '@tldraw/tlschema'
import { T } from '@tldraw/validate'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { WebSocket, WebSocketServer } from 'ws'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const PORT = process.env.PORT || 8787
const SAVE_INTERVAL_MS = 5000
const ROOM_IDLE_TTL_MS = 5 * 60 * 1000
const ROOM_SWEEP_INTERVAL_MS = 60 * 1000

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const GenerateNodeSizeValidator = T.literal('2K')
const GenerateNodeOutputFormatValidator = T.literalEnum('png', 'jpeg', 'webp')
const GenerateNodeResponseFormatValidator = T.literal('url')
const GenerateNodeSequentialImageGenerationValidator = T.literalEnum(
  'disabled',
  'auto'
)

const NodeTypeValidator = T.union('type', {
  model: T.object({
    type: T.literal('model'),
    provider: T.string,
    modelId: T.string,
    w: T.number.optional(),
    h: T.number.optional(),
  }),
  prompt: T.object({
    type: T.literal('prompt'),
    text: T.string,
    w: T.number.optional(),
    h: T.number.optional(),
  }),
  generate: T.object({
    type: T.literal('generate'),
    size: GenerateNodeSizeValidator,
    outputFormat: GenerateNodeOutputFormatValidator,
    responseFormat: GenerateNodeResponseFormatValidator,
    watermark: T.boolean,
    seed: T.number,
    guidanceScale: T.number,
    sequentialImageGeneration: GenerateNodeSequentialImageGenerationValidator,
    lastResultUrl: T.string.nullable(),
    w: T.number.optional(),
    h: T.number.optional(),
  }),
  generate_text: T.object({
    type: T.literal('generate_text'),
    lastResultText: T.string.nullable(),
    w: T.number.optional(),
    h: T.number.optional(),
  }),
  load_image: T.object({
    type: T.literal('load_image'),
    imageUrl: T.string.nullable(),
    w: T.number.optional(),
    h: T.number.optional(),
  }),
  preview: T.object({
    type: T.literal('preview'),
    lastImageUrl: T.string.nullable(),
    w: T.number.optional(),
    h: T.number.optional(),
  }),
})

const customSchema = createTLSchema({
  shapes: {
    ...defaultShapeSchemas,
    node: {
      props: {
        node: NodeTypeValidator,
        isOutOfDate: T.boolean,
      },
    },
    connection: {
      props: {
        start: vecModelValidator,
        end: vecModelValidator,
      },
    },
  },
  bindings: {
    ...defaultBindingSchemas,
    connection: {
      props: {
        portId: T.string,
        terminal: T.literalEnum('start', 'end'),
        order: T.number.optional(),
      },
    },
  },
})

type ManagedRoom = {
  room: TLSocketRoom<TLRecord>
  storage: InMemorySyncStorage<TLRecord>
  saveTimer: NodeJS.Timeout
  lastAccessedAt: number
}

const rooms = new Map<string, ManagedRoom>()

function getRoomFilePath(roomId: string) {
  return path.join(DATA_DIR, `${roomId}.json`)
}

function migrateLegacyNodeType(node: Record<string, unknown>) {
  if (node.type !== 'generate') {
    return node
  }

  return {
    ...node,
    size: '2K',
    outputFormat:
      node.outputFormat === 'png' ||
      node.outputFormat === 'jpeg' ||
      node.outputFormat === 'webp'
        ? node.outputFormat
        : 'png',
    responseFormat: 'url',
    watermark: typeof node.watermark === 'boolean' ? node.watermark : false,
    seed: typeof node.seed === 'number' ? node.seed : Math.floor(Math.random() * 99999),
    guidanceScale:
      typeof node.guidanceScale === 'number'
        ? node.guidanceScale
        : typeof node.cfgScale === 'number'
          ? node.cfgScale
          : 3,
    sequentialImageGeneration:
      node.sequentialImageGeneration === 'disabled' ||
      node.sequentialImageGeneration === 'auto'
        ? node.sequentialImageGeneration
        : 'disabled',
    lastResultUrl:
      typeof node.lastResultUrl === 'string' || node.lastResultUrl === null
        ? node.lastResultUrl
        : null,
  }
}

function migrateSnapshot(snapshot: RoomSnapshot): RoomSnapshot {
  const documents = snapshot.documents.map((entry) => {
    const state = entry.state as unknown as {
      type?: string
      props?: {
        node?: Record<string, unknown>
      }
    }

    if (state.type !== 'node' || !state.props?.node) {
      return entry
    }

    return {
      ...entry,
      state: {
        ...(entry.state as unknown as Record<string, unknown>),
        props: {
          ...(state.props as Record<string, unknown>),
          node: migrateLegacyNodeType(state.props.node),
        },
      } as unknown as TLRecord,
    }
  })

  return {
    ...snapshot,
    documents,
  }
}

function saveSnapshot(roomId: string, storage: InMemorySyncStorage<TLRecord>) {
  const filePath = getRoomFilePath(roomId)
  const snapshot = storage.getSnapshot()
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2))
}

function loadSnapshot(roomId: string): RoomSnapshot | null {
  const filePath = getRoomFilePath(roomId)
  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as RoomSnapshot
    return migrateSnapshot(parsed)
  } catch (error) {
    console.error(`Failed to load snapshot for room ${roomId}:`, error)
    return null
  }
}

function createRoom(roomId: string) {
  const snapshot = loadSnapshot(roomId)
  const storage = new InMemorySyncStorage<TLRecord>({
    snapshot: snapshot ?? undefined,
  })

  const room = new TLSocketRoom<TLRecord>({
    schema: customSchema,
    storage,
    onDataChange() {
      const managedRoom = rooms.get(roomId)
      if (!managedRoom) return
      managedRoom.lastAccessedAt = Date.now()
    },
  })

  const saveTimer = setInterval(() => {
    saveSnapshot(roomId, storage)
  }, SAVE_INTERVAL_MS)

  const managedRoom: ManagedRoom = {
    room,
    storage,
    saveTimer,
    lastAccessedAt: Date.now(),
  }

  rooms.set(roomId, managedRoom)
  return managedRoom
}

function getOrCreateRoom(roomId: string) {
  const existing = rooms.get(roomId)
  if (existing) {
    existing.lastAccessedAt = Date.now()
    return existing
  }
  return createRoom(roomId)
}

function destroyRoom(roomId: string) {
  const managedRoom = rooms.get(roomId)
  if (!managedRoom) return

  clearInterval(managedRoom.saveTimer)
  saveSnapshot(roomId, managedRoom.storage)
  managedRoom.room.close()
  rooms.delete(roomId)
}

setInterval(() => {
  const now = Date.now()
  for (const [roomId, managedRoom] of rooms.entries()) {
    if (now - managedRoom.lastAccessedAt > ROOM_IDLE_TTL_MS) {
      destroyRoom(roomId)
    }
  }
}, ROOM_SWEEP_INTERVAL_MS)

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', rooms: rooms.size })
})

app.post('/rooms', (_req, res) => {
  const roomId = uuidv4()
  getOrCreateRoom(roomId)
  res.json({ roomId })
})

const server = createServer(app)
const wss = new WebSocketServer({ server })

wss.on('connection', (socket: WebSocket, request) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`)
  const roomId = url.searchParams.get('roomId')

  if (!roomId) {
    socket.close(1008, 'roomId is required')
    return
  }

  const { room } = getOrCreateRoom(roomId)
  room.handleSocketConnect({
    sessionId: uuidv4(),
    socket,
    isReadonly: false,
  })
})

server.listen(PORT, () => {
  console.log(`Sync server listening on http://localhost:${PORT}`)
})

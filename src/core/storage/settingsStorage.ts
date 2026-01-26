import type { StateStorage } from 'zustand/middleware'
import { SETTINGS, idbDel, idbGet, idbSet } from './db'

/** Zustand `persist` storage backed by IndexedDB (works in web + Tauri). */
export const idbStateStorage: StateStorage = {
  getItem: async (name) => (await idbGet<string>(SETTINGS, name)) ?? null,
  setItem: async (name, value) => {
    await idbSet(SETTINGS, name, value)
  },
  removeItem: async (name) => {
    await idbDel(SETTINGS, name)
  },
}

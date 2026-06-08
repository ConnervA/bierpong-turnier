import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Muss dem Repository-Namen entsprechen, damit Assets auf
  // https://connerva.github.io/bierpong-turnier/ korrekt geladen werden.
  base: '/bierpong-turnier/',
})

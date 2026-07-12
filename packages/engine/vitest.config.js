import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    name: 'engine',
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '#tabletop-host-actions': resolve(
        root,
        'src/runtime/internal/actions/emptyHostActions.js',
      ),
    },
  },
})

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'cards',
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
})

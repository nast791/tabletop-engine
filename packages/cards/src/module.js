import {
  addImportsDir,
  createResolver,
  defineNuxtModule,
  resolvePath,
} from '@nuxt/kit'
import { dirname } from 'node:path'

/**
 * Nuxt-модуль интерпретатора карт.
 * Хост передаёт реестр эффектов через tabletopCards.effects → #tabletop-card-effects.
 */
export default defineNuxtModule({
  meta: {
    name: '@nast791/cards',
    configKey: 'tabletopCards',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    // Путь к реестру эффектов хоста (default export: { TYPE: handler } или { effects: {…} })
    effects: null,
  },
  setup: async (options, nuxt) => {
    const resolver = createResolver(import.meta.url)

    const emptyHostEffects = resolver.resolve(
      './runtime/internal/emptyHostEffects.js',
    )
    let hostEffectsPath = emptyHostEffects
    if (options.effects) {
      hostEffectsPath = await resolvePath(options.effects, {
        cwd: nuxt.options.rootDir,
        extensions: ['.js', '.mjs', '.ts'],
      })
    }

    nuxt.options.alias = nuxt.options.alias || {}
    nuxt.options.alias['#tabletop-card-effects'] = hostEffectsPath

    nuxt.options.runtimeConfig.public.tabletopCards = {
      ...(nuxt.options.runtimeConfig.public.tabletopCards || {}),
    }
    nuxt.options.runtimeConfig.tabletopCards = {
      ...(nuxt.options.runtimeConfig.tabletopCards || {}),
      hostEffectsPath,
    }

    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {}
      nitroConfig.alias['#tabletop-card-effects'] = hostEffectsPath

      nitroConfig.externals = nitroConfig.externals || {}
      const inline = new Set(nitroConfig.externals.inline || [])
      inline.add(hostEffectsPath)
      nitroConfig.externals.inline = [...inline]

      nitroConfig.watch = nitroConfig.watch || []
      if (!nitroConfig.watch.includes(hostEffectsPath)) {
        nitroConfig.watch.push(hostEffectsPath)
      }
      const effectsDir = dirname(hostEffectsPath)
      if (effectsDir && !nitroConfig.watch.includes(effectsDir)) {
        nitroConfig.watch.push(effectsDir)
      }
    })

    addImportsDir(resolver.resolve('./runtime/composables'))
  },
})

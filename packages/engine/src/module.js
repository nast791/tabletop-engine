import {
  addImportsDir,
  addServerHandler,
  createResolver,
  defineNuxtModule,
  resolvePath,
} from '@nuxt/kit'
import { dirname } from 'node:path'

/**
 * Универсальный Nuxt-модуль: не знает структуру хост-проекта.
 * Хост передаёт реестр actions через tabletopEngine.actions → #tabletop-host-actions.
 */
export default defineNuxtModule({
  meta: {
    name: '@nast791/engine',
    configKey: 'tabletopEngine',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    apiPrefix: '/api/tabletop',
    // Путь к реестру хоста (default export: { TYPE: handler })
    // Пример в проекте: '#shared/actions/index.js'
    actions: null,
  },
  setup: async (options, nuxt) => {
    const resolver = createResolver(import.meta.url)
    const prefix = options.apiPrefix.replace(/\/$/, '')

    const emptyHostActions = resolver.resolve(
      './runtime/internal/actions/emptyHostActions.js',
    )
    let hostActionsPath = emptyHostActions
    if (options.actions) {
      hostActionsPath = await resolvePath(options.actions, {
        cwd: nuxt.options.rootDir,
        extensions: ['.js', '.mjs', '.ts'],
      })
    }

    nuxt.options.runtimeConfig.public.tabletopEngine = {
      apiPrefix: prefix,
    }
    nuxt.options.runtimeConfig.tabletopEngine = {
      ...(nuxt.options.runtimeConfig.tabletopEngine || {}),
      hostActionsPath,
    }

    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {}
      nitroConfig.alias['#tabletop-host-actions'] = hostActionsPath

      // Только переданный реестр — без знаний о shared/events/helpers проекта.
      nitroConfig.externals = nitroConfig.externals || {}
      const inline = new Set(nitroConfig.externals.inline || [])
      inline.add(hostActionsPath)
      nitroConfig.externals.inline = [...inline]

      nitroConfig.watch = nitroConfig.watch || []
      if (!nitroConfig.watch.includes(hostActionsPath)) {
        nitroConfig.watch.push(hostActionsPath)
      }
      const actionsDir = dirname(hostActionsPath)
      if (actionsDir && !nitroConfig.watch.includes(actionsDir)) {
        nitroConfig.watch.push(actionsDir)
      }
    })

    addImportsDir(resolver.resolve('./runtime/composables'))

    addServerHandler({
      route: `${prefix}/create`,
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/create.post.js'),
    })
    addServerHandler({
      route: `${prefix}/action`,
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/action.post.js'),
    })
    addServerHandler({
      route: `${prefix}/view`,
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/view.get.js'),
    })
  },
})

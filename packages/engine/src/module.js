import {
  addImportsDir,
  addServerHandler,
  createResolver,
  defineNuxtModule,
  resolvePath,
} from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@nast791/engine',
    configKey: 'tabletopEngine',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    // Префикс API-роутов
    apiPrefix: '/api/tabletop',
    // Путь к хостовому реестру actions (default export: { TYPE: handler })
    // Пример: '#shared/actions/registry.js'
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
    })

    // Только внешние composables — автоимпорт в целевой проект.
    // runtime/internal/composables не сканируется.
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

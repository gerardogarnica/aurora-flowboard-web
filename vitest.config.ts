import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// A negative UTC offset with no DST, so the "previous day" bug of parsing `YYYY-MM-DD` as UTC
// midnight reproduces on every machine and in CI. Set here, before the workers start.
process.env.TZ = 'America/Bogota'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/test/setup.ts'],
      // api-client reads VITE_API_BASE_URL once at import; this also keeps tests off .env.local.
      env: { VITE_API_BASE_URL: 'http://api.test' },
      unstubGlobals: true,
      restoreMocks: true,
    },
  }),
)

import {defineConfig, devices} from '@playwright/test'

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1, // No parallelization initially
	reporter: process.env.CI ? [['html'], ['list']] : 'html',
	use: {
		baseURL: 'http://127.0.0.1:4173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		testIdAttribute: 'data-cy', // Preserve existing data-cy selectors
	},
	projects: [
		{
			name: 'chromium',
			use: {...devices['Desktop Chrome']},
		},
	],
	// webServer configuration removed - we manually start services in CI
	// For local development, run `pnpm preview` and `pnpm preview:vikunja` separately
})

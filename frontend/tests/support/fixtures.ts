import {test as base, type APIRequestContext, type Page} from '@playwright/test'
import {Factory} from './factory'
import {login, createFakeUser} from './authenticateUser'

export const test = base.extend<{
	apiContext: APIRequestContext;
	authenticatedPage: Page;
	currentUser: any;
}>({
	apiContext: async ({playwright}, use) => {
		const apiContext = await playwright.request.newContext({
			baseURL: process.env.API_URL || 'http://localhost:3456/api/v1',
			extraHTTPHeaders: {
				'Authorization': process.env.TEST_SECRET || 'averyLongSecretToSe33dtheDB',
			},
		})

		Factory.setRequestContext(apiContext)
		await use(apiContext)
		await apiContext.dispose()
	},

	currentUser: async ({apiContext}, use) => {
		const user = createFakeUser()
		await use(user)
	},

	authenticatedPage: async ({page, apiContext, currentUser}, use) => {
		await login(page, apiContext, currentUser)
		await use(page)
	},
})

export {expect} from '@playwright/test'

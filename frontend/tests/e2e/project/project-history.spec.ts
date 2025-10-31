import {test, expect} from '../../support/fixtures'
import {ProjectFactory} from '../../factories/project'
import {ProjectViewFactory} from '../../factories/project_view'

test.describe('Project History', () => {
	test('should show a project history on the home page', async ({authenticatedPage: page}) => {
		const loadProjectArrayPromise = page.waitForResponse(response =>
			response.url().includes('/projects') && !response.url().includes('/projects/'),
		)

		const projects = ProjectFactory.create(7)
		ProjectViewFactory.truncate()
		projects.forEach(p => ProjectViewFactory.create(1, {
			id: p.id,
			project_id: p.id,
		}, false))

		await page.goto('/')
		await loadProjectArrayPromise
		await expect(page.locator('body')).not.toContainText('Last viewed')

		for (let i = 0; i < projects.length; i++) {
			const loadProjectPromise = page.waitForResponse(response =>
				response.url().includes(`/projects/${projects[i].id}`) && response.request().method() === 'GET',
			)
			await page.goto(`/projects/${projects[i].id}/${projects[i].id}`)
			await loadProjectPromise
		}

		// Not using goto here to work around the redirect issue fixed in #1337
		await page.locator('nav.menu.top-menu a').filter({hasText: 'Overview'}).click()

		await expect(page.locator('body')).toContainText('Last viewed')
		await expect(page.locator('[data-cy="projectCardGrid"]')).not.toContainText(projects[0].title)
		await expect(page.locator('[data-cy="projectCardGrid"]')).toContainText(projects[1].title)
		await expect(page.locator('[data-cy="projectCardGrid"]')).toContainText(projects[2].title)
		await expect(page.locator('[data-cy="projectCardGrid"]')).toContainText(projects[3].title)
		await expect(page.locator('[data-cy="projectCardGrid"]')).toContainText(projects[4].title)
		await expect(page.locator('[data-cy="projectCardGrid"]')).toContainText(projects[5].title)
		await expect(page.locator('[data-cy="projectCardGrid"]')).toContainText(projects[6].title)
	})
})

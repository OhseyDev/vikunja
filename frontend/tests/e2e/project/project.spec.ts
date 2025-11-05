import {test, expect} from '../../support/fixtures'
import {TaskFactory} from '../../factories/task'
import {ProjectFactory} from '../../factories/project'
import {createProjects} from './prepareProjects'

test.describe('Projects', () => {
	test.use({
		// Use authenticated page for all tests
	})

	let projects: any[]

	test.beforeEach(async ({authenticatedPage}) => {
		projects = await createProjects()
	})

	test('Should create a new project', async ({authenticatedPage: page}) => {
		await page.goto('/projects')
		await page.locator('.project-header [data-cy=new-project]').click()
		await expect(page).toHaveURL(/\/projects\/new/)
		await expect(page.locator('.card-header-title')).toContainText('New project')
		await page.locator('input[name=projectTitle]').fill('New Project')
		await page.locator('.button').filter({hasText: 'Create'}).click()

		await expect(page.locator('.global-notification', {timeout: 1000})).toContainText('Success')
		await expect(page).toHaveURL(/\/projects\//)
		await expect(page.locator('.project-title')).toContainText('New Project')
	})

	test('Should redirect to a specific project view after visited', async ({authenticatedPage: page}) => {
		const loadBucketsPromise = page.waitForResponse(response =>
			response.url().includes('/projects/') &&
			response.url().includes('/views/') &&
			response.url().includes('/tasks'),
		)

		await page.goto('/projects/1/4')
		await expect(page).toHaveURL(/\/projects\/1\/4/)
		await loadBucketsPromise
		await page.goto('/projects/1')
		await expect(page).toHaveURL(/\/projects\/1\/4/)
	})

	test('Should rename the project in all places', async ({authenticatedPage: page}) => {
		await TaskFactory.create(5, {
			id: '{increment}',
			project_id: 1,
		})
		const newProjectName = 'New project name'

		await page.goto('/projects/1')
		await expect(page.locator('.project-title')).toContainText('First Project')

		await page.locator('.menu-container .menu-list li:first-child .dropdown .menu-list-dropdown-trigger').click()
		await page.locator('.menu-container .menu-list li:first-child .dropdown .dropdown-content').filter({hasText: 'Edit'}).click()
		await page.locator('#title:not(:disabled)').fill(newProjectName)
		await page.locator('footer.card-footer .button').filter({hasText: 'Save'}).click()

		await expect(page.locator('.global-notification')).toContainText('Success')
		await expect(page.locator('.project-title')).toContainText(newProjectName)
		await expect(page.locator('.project-title')).not.toContainText(projects[0].title)
		await expect(page.locator('.menu-container .menu-list li:first-child')).toContainText(newProjectName)
		await expect(page.locator('.menu-container .menu-list li:first-child')).not.toContainText(projects[0].title)
		await page.goto('/')
		await expect(page.locator('.project-grid')).toContainText(newProjectName)
		await expect(page.locator('.project-grid')).not.toContainText(projects[0].title)
	})

	test('Should remove a project when deleting it', async ({authenticatedPage: page}) => {
		await page.goto(`/projects/${projects[0].id}`)

		await page.locator('.menu-container .menu-list li:first-child .dropdown .menu-list-dropdown-trigger').click()
		await page.locator('.menu-container .menu-list li:first-child .dropdown .dropdown-content').filter({hasText: 'Delete'}).click()
		await expect(page).toHaveURL(/\/settings\/delete/)
		await page.locator('[data-cy="modalPrimary"]').filter({hasText: 'Do it'}).click()

		await expect(page.locator('.global-notification')).toContainText('Success')
		await expect(page.locator('.menu-container .menu-list')).not.toContainText(projects[0].title)
		await expect(page).toHaveURL('/')
	})

	test('Should archive a project', async ({authenticatedPage: page}) => {
		await page.goto(`/projects/${projects[0].id}`)

		await page.locator('.project-title-dropdown').click()
		await page.locator('.project-title-dropdown .dropdown-menu .dropdown-item').filter({hasText: 'Archive'}).click()
		await expect(page.locator('.modal-content')).toContainText('Archive this project')
		await page.locator('.modal-content [data-cy=modalPrimary]').click()

		await expect(page.locator('.menu-container .menu-list')).not.toContainText(projects[0].title)
		await expect(page.locator('main.app-content')).toContainText('This project is archived. It is not possible to create new or edit tasks for it.')
	})

	test('Should show all projects on the projects page', async ({authenticatedPage: page}) => {
		const projects = await ProjectFactory.create(10)

		await page.goto('/projects')

		for (const p of projects) {
			await expect(page.locator('[data-cy="projects-list"]')).toContainText(p.title)
		}
	})

	test('Should not show archived projects if the filter is not checked', async ({authenticatedPage: page}) => {
		await ProjectFactory.create(1, {
			id: 2,
		}, false)
		await ProjectFactory.create(1, {
			id: 3,
			is_archived: true,
		}, false)

		// Initial
		await page.goto('/projects')
		await expect(page.locator('.project-grid')).not.toContainText('Archived')

		// Show archived
		await page.locator('[data-cy="show-archived-check"] label span').click()
		await expect(page.locator('[data-cy="show-archived-check"] input')).toBeChecked()
		await expect(page.locator('.project-grid')).toContainText('Archived')

		// Don't show archived
		await page.locator('[data-cy="show-archived-check"] label span').click()
		await expect(page.locator('[data-cy="show-archived-check"] input')).not.toBeChecked()

		// Second time visiting after unchecking
		await page.goto('/projects')
		await expect(page.locator('[data-cy="show-archived-check"] input')).not.toBeChecked()
		await expect(page.locator('.project-grid')).not.toContainText('Archived')
	})
})

import {test, expect} from '../../support/fixtures'
import {TaskFactory} from '../../factories/task'
import {ProjectFactory} from '../../factories/project'

test.describe('Project View Table', () => {
	test('Should show a table with tasks', async ({authenticatedPage: page}) => {
		const projects = ProjectFactory.create(1)
		const tasks = TaskFactory.create(1)
		await page.goto('/projects/1/3')

		await expect(page.locator('.project-table table.table')).toBeVisible()
		await expect(page.locator('.project-table table.table')).toContainText(tasks[0].title)
	})

	test('Should have working column switches', async ({authenticatedPage: page}) => {
		const projects = ProjectFactory.create(1)
		TaskFactory.create(1)
		await page.goto('/projects/1/3')

		await page.locator('.project-table .filter-container .button').filter({hasText: 'Columns'}).click()
		await page.locator('.project-table .filter-container .card.columns-filter .card-content .fancy-checkbox').filter({hasText: 'Priority'}).click()
		await page.locator('.project-table .filter-container .card.columns-filter .card-content .fancy-checkbox').filter({hasText: 'Done'}).click()

		await expect(page.locator('.project-table table.table th').filter({hasText: 'Priority'})).toBeVisible()
		await expect(page.locator('.project-table table.table th').filter({hasText: 'Done'})).not.toBeVisible()
	})

	test('Should navigate to the task when the title is clicked', async ({authenticatedPage: page}) => {
		const projects = ProjectFactory.create(1)
		const tasks = TaskFactory.create(5, {
			id: '{increment}',
			project_id: 1,
		})
		await page.goto('/projects/1/3')

		await page.locator('.project-table table.table').filter({hasText: tasks[0].title}).click()

		await expect(page).toHaveURL(new RegExp(`/tasks/${tasks[0].id}`))
	})
})

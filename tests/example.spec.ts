import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Todo App Tests', () => {
  test.describe('Login Tests', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await page.getByPlaceholder('Enter your username').fill('user');
      await page.getByPlaceholder('Enter your password').fill('password');
      await page.getByRole('button', { name: 'Sign In' }).click();
      
      await expect(page).toHaveURL(/.*protected/);
      await expect(page.getByText('My Todo List')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await page.getByPlaceholder('Enter your username').fill('wrong');
      await page.getByPlaceholder('Enter your password').fill('wrong');
      await page.getByRole('button', { name: 'Sign In' }).click();
      
      await expect(page.getByText('Invalid credentials')).toBeVisible();
    });
  });

  test.describe('Create Todo Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.getByPlaceholder('Enter your username').fill('user');
      await page.getByPlaceholder('Enter your password').fill('password');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByText('My Todo List')).toBeVisible();
    });

    test('should create a new todo', async ({ page }) => {
      await page.getByPlaceholder('What needs to be done?').fill('New todo item');
      await page.getByRole('button', { name: 'Add Task' }).click();
      
      await expect(page.getByText('New todo item')).toBeVisible();
      await expect(page.locator('text=Total Tasks').locator('..').locator('text=1')).toBeVisible();
    });

    test('should create multiple todos', async ({ page }) => {
      const todos = ['First todo', 'Second todo', 'Third todo'];
      
      for (const todo of todos) {
        await page.getByPlaceholder('What needs to be done?').fill(todo);
        await page.getByRole('button', { name: 'Add Task' }).click();
        await expect(page.getByText(todo)).toBeVisible();
      }
      
      await expect(page.locator('text=Total Tasks').locator('..').locator('text=3')).toBeVisible();
    });

    test('should not create empty todo', async ({ page }) => {
      await page.getByRole('button', { name: 'Add Task' }).click();
      await expect(page.getByText('No todos found')).toBeVisible();
    });
  });

  test.describe('Read Todo Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.getByPlaceholder('Enter your username').fill('user');
      await page.getByPlaceholder('Enter your password').fill('password');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByText('My Todo List')).toBeVisible();
    });

    test('should display empty state initially', async ({ page }) => {
      await expect(page.getByText('No todos found')).toBeVisible();
      await expect(page.getByText('Add a new task to get started!')).toBeVisible();
    });

    test('should display statistics', async ({ page }) => {
      await expect(page.getByText('Total Tasks')).toBeVisible();
      await expect(page.locator('text=Completed').first()).toBeVisible();
      await expect(page.getByText('Remaining')).toBeVisible();
    });

    test('should read existing todos', async ({ page }) => {
      await page.getByPlaceholder('What needs to be done?').fill('Read test todo');
      await page.getByRole('button', { name: 'Add Task' }).click();
      
      await expect(page.getByText('Read test todo')).toBeVisible();
      await expect(page.locator('text=MEDIUM').first()).toBeVisible();
    });
  });

  test.describe('Update Todo Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.getByPlaceholder('Enter your username').fill('user');
      await page.getByPlaceholder('Enter your password').fill('password');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByText('My Todo List')).toBeVisible();
      
      await page.getByPlaceholder('What needs to be done?').fill('Original todo');
      await page.getByRole('button', { name: 'Add Task' }).click();
    });

    test('should edit todo by double-clicking', async ({ page }) => {
      await page.getByText('Original todo').dblclick();
      await page.locator('input[value="Original todo"]').fill('Updated todo');
      await page.locator('input[value="Updated todo"]').press('Enter');
      
      await expect(page.getByText('Updated todo')).toBeVisible();
      await expect(page.getByText('Original todo')).not.toBeVisible();
    });

    test('should change todo priority', async ({ page }) => {
      await page.getByRole('combobox').selectOption('high');
      await expect(page.locator('text=HIGH').first()).toBeVisible();
      
      await page.getByRole('combobox').selectOption('low');
      await expect(page.locator('text=LOW').first()).toBeVisible();
    });
  });

  test.describe('Delete Todo Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.getByPlaceholder('Enter your username').fill('user');
      await page.getByPlaceholder('Enter your password').fill('password');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByText('My Todo List')).toBeVisible();
      
      await page.getByPlaceholder('What needs to be done?').fill('Todo to delete');
      await page.getByRole('button', { name: 'Add Task' }).click();
    });

    test('should delete a todo', async ({ page }) => {
      await expect(page.getByText('Todo to delete')).toBeVisible();
      
      const deleteButton = page.locator('button[class*="hover:text-red-500"]').last();
      await deleteButton.click();
      
      await expect(page.getByText('Todo to delete')).not.toBeVisible();
    });

    test('should delete multiple todos', async ({ page }) => {
      await page.getByPlaceholder('What needs to be done?').fill('Second todo');
      await page.getByRole('button', { name: 'Add Task' }).click();
      
      // Get the todo IDs by finding the test IDs
      const secondTodoText = page.getByTestId(/todo-text-/).filter({ hasText: 'Second todo' });
      const secondTodoId = await secondTodoText.getAttribute('data-testid');
      const secondTodoDeleteButton = page.getByTestId(`delete-${secondTodoId?.replace('todo-text-', '')}`);
      await secondTodoDeleteButton.click();
      await expect(page.getByText('Second todo')).not.toBeVisible();
      
      // Delete the first todo
      const firstTodoText = page.getByTestId(/todo-text-/).filter({ hasText: 'Todo to delete' });
      const firstTodoId = await firstTodoText.getAttribute('data-testid');
      const firstTodoDeleteButton = page.getByTestId(`delete-${firstTodoId?.replace('todo-text-', '')}`);
      await firstTodoDeleteButton.click();
      await expect(page.getByText('Todo to delete')).not.toBeVisible();
    });
  });

  test.describe('Toggle Todo Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.getByPlaceholder('Enter your username').fill('user');
      await page.getByPlaceholder('Enter your password').fill('password');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByText('My Todo List')).toBeVisible();
      
      await page.getByPlaceholder('What needs to be done?').fill('Toggle test todo');
      await page.getByRole('button', { name: 'Add Task' }).click();
    });

    test('should toggle todo to complete', async ({ page }) => {
      // Find the toggle test todo and get its ID
      const toggleTodoText = page.getByTestId(/todo-text-/).filter({ hasText: 'Toggle test todo' });
      const toggleTodoId = await toggleTodoText.getAttribute('data-testid');
      const checkbox = page.getByTestId(`toggle-${toggleTodoId?.replace('todo-text-', '')}`);
      
      await checkbox.click();
      
      await expect(page.locator('text=Completed').locator('..').locator('text=1')).toBeVisible();
      await expect(page.locator('text=Remaining').locator('..').locator('text=0')).toBeVisible();
    });

    test('should toggle todo back to incomplete', async ({ page }) => {
      // Find the toggle test todo and get its ID
      const toggleTodoText = page.getByTestId(/todo-text-/).filter({ hasText: 'Toggle test todo' });
      const toggleTodoId = await toggleTodoText.getAttribute('data-testid');
      const checkbox = page.getByTestId(`toggle-${toggleTodoId?.replace('todo-text-', '')}`);
      
      // First click to complete the todo
      await checkbox.click();
      await expect(page.locator('text=Completed').locator('..').locator('text=1')).toBeVisible();
      
      // Second click to uncomplete the todo
      await checkbox.click();
      await expect(page.locator('text=Completed').locator('..').locator('text=0')).toBeVisible();
      await expect(page.locator('text=Remaining').locator('..').locator('text=1')).toBeVisible();
    });

    test('should filter completed todos', async ({ page }) => {
      // Find the toggle test todo and get its ID
      const toggleTodoText = page.getByTestId(/todo-text-/).filter({ hasText: 'Toggle test todo' });
      const toggleTodoId = await toggleTodoText.getAttribute('data-testid');
      const checkbox = page.getByTestId(`toggle-${toggleTodoId?.replace('todo-text-', '')}`);
      
      await checkbox.click();
      
      await page.locator('button:has-text("Completed")').click();
      await expect(page.getByText('Toggle test todo')).toBeVisible();
      
      await page.locator('button:has-text("Active")').click();
      await expect(page.getByText('Toggle test todo')).not.toBeVisible();
    });
  });
});

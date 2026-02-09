import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    browserName: 'chromium',
    headless: false,

   
    viewport: null,

    launchOptions: {
      args: ['--start-maximized'],
    },
  },
});

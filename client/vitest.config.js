import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    include: [
      'src/__tests__/simple.test.js', 
      'src/__tests__/simple.vitest.test.jsx', 
      'src/__tests__/components/Header.vitest.test.jsx', 
      'src/__tests__/components/auth/Login.vitest.test.jsx',
      'src/__tests__/components/driver/Dashboard.vitest.test.jsx',
      'src/__tests__/components/company/Dashboard.vitest.test.jsx',
      'src/__tests__/components/common/PrivateRoute.vitest.test.jsx',
      'src/__tests__/context/AuthContext.vitest.test.jsx',
      'src/__tests__/utils/vitestUtils.vitest.test.jsx'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/setupTests.js'],
    },
  },
});

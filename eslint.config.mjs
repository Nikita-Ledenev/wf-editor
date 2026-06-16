import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'backend/**',
      '**/cypress/**',
      '**/*.config.{js,ts}',
      '**/coverage/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // Таблица — Vue 3 + TS.
  ...vue.configs['flat/recommended'],
  {
    files: ['packages/table-vue/**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      // App.vue — корневой компонент, одно слово допустимо.
      'vue/multi-word-component-names': 'off',
    },
  },

  // Диаграмма — React 19 + TS.
  {
    files: ['packages/diagram-react/**/*.{ts,tsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Новый JSX-трансформ — import React не нужен.
      'react/react-in-jsx-scope': 'off',
    },
  },

  prettier,
);

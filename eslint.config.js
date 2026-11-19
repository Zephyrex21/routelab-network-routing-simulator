const browserGlobals = Object.fromEntries([
  'window', 'document', 'navigator', 'location', 'history', 'localStorage',
  'sessionStorage', 'HTMLElement', 'HTMLInputElement', 'HTMLButtonElement',
  'Element', 'Node', 'CustomEvent', 'Event', 'MouseEvent', 'KeyboardEvent',
  'PointerEvent', 'WheelEvent', 'File', 'FileList', 'FileReader', 'Blob',
  'FormData', 'DOMException', 'MutationObserver', 'IntersectionObserver',
  'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame',
  'matchMedia', 'getComputedStyle', 'Image', 'performance', 'atob', 'btoa',
].map((name) => [name, 'readonly']));

const runtimeGlobals = Object.fromEntries([
  'globalThis', 'console', 'process', 'Buffer', 'URL', 'URLSearchParams',
  'fetch', 'Headers', 'Request', 'Response', 'AbortController', 'AbortSignal',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'setImmediate', 'clearImmediate', 'queueMicrotask', 'structuredClone',
  'crypto', 'Intl', 'Date', 'Math', 'JSON', 'Object', 'Array', 'String',
  'Number', 'Boolean', 'BigInt', 'Symbol', 'Map', 'Set', 'WeakMap', 'WeakSet',
  'Promise', 'RegExp', 'Error', 'TypeError', 'RangeError', 'ReferenceError',
  'SyntaxError', 'EvalError', 'AggregateError', 'NaN', 'Infinity', 'parseInt',
  'parseFloat', 'isFinite', 'isNaN',
].map((name) => [name, 'readonly']));

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'test-results/**', 'playwright-report/**'],
  },
  {
    files: ['src/**/*.{js,jsx}', 'tests/**/*.js', 'scripts/**/*.mjs', 'vite.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...browserGlobals, ...runtimeGlobals },
    },
    rules: {
      'no-undef': 'error',
      'no-debugger': 'error',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-self-assign': 'error',
      'no-unsafe-finally': 'error',
      'no-unexpected-multiline': 'error',
      'valid-typeof': 'error',
    },
  },
  {
    files: ['src/**/*.js', 'tests/**/*.js', 'scripts/**/*.mjs', 'vite.config.js'],
    rules: {
      'no-unused-vars': ['error', {
        args: 'none',
        caughtErrors: 'none',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
      }],
    },
  },
];

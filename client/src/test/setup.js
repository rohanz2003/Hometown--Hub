/**
 * test/setup.js — global test setup for the frontend suite.
 */
import '@testing-library/jest-dom';

// jsdom does not implement matchMedia, which ThemeContext reads on mount.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

// Nor URL.createObjectURL, used by the image preview in the post composer.
if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = () => 'blob:preview';
  window.URL.revokeObjectURL = () => {};
}

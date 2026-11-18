import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Polyfill URL.createObjectURL and URL.revokeObjectURL for JSDOM
if (typeof window !== 'undefined') {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = (_blob) => `blob:mock-url-${Math.random()}`;
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = () => {};
  }

  // Provide basic canvas mocking for JSDOM
  if (typeof HTMLCanvasElement !== 'undefined') {
    if (!HTMLCanvasElement.prototype.getContext) {
      HTMLCanvasElement.prototype.getContext = () => ({
        drawImage: () => {},
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
        putImageData: () => {},
        clearRect: () => {},
      });
    }
    if (!HTMLCanvasElement.prototype.toBlob) {
      HTMLCanvasElement.prototype.toBlob = function (callback, mime = 'image/webp') {
        const dummyBlob = new Blob(['mock-image-binary-data'], { type: mime });
        setTimeout(() => callback(dummyBlob), 0);
      };
    }
  }
}

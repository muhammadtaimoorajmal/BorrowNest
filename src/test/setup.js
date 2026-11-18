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
    HTMLCanvasElement.prototype.getContext = () => ({
      drawImage: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: () => {},
      clearRect: () => {},
    });
    HTMLCanvasElement.prototype.toBlob = function (callback, mime = 'image/webp') {
      const dummyBlob = new Blob(['mock-image-binary-data'], { type: mime });
      setTimeout(() => callback(dummyBlob), 0);
    };
  }

  // Provide basic Image loading mock for JSDOM
  if (typeof Image !== 'undefined') {
    Object.defineProperty(Image.prototype, 'naturalWidth', {
      get() {
        return this._naturalWidth || 800;
      },
      set(val) {
        this._naturalWidth = val;
      },
      configurable: true,
    });
    Object.defineProperty(Image.prototype, 'naturalHeight', {
      get() {
        return this._naturalHeight || 600;
      },
      set(val) {
        this._naturalHeight = val;
      },
      configurable: true,
    });
    Object.defineProperty(Image.prototype, 'src', {
      set(src) {
        this._src = src;
        setTimeout(() => {
          this._naturalWidth = 800;
          this._naturalHeight = 600;
          this.width = 800;
          this.height = 600;
          if (typeof this.onload === 'function') {
            this.onload();
          }
        }, 0);
      },
      get() {
        return this._src;
      },
      configurable: true,
    });
  }
}

class ScreenshotButton extends HTMLElement {
  static #htmlContent = `
        <style>
          #canvas, #video {
            display: none;
          }
        </style>
        <video id="video">Video stream not available.</video>
        <canvas id="canvas"></canvas>
        <button id="startButton"></button>
      `;
  #text;
  #useComputedStyle;
  #timeout;
  #previewTargetScale;
  #video;
  #canvas;
  #screenshot;
  #removeAttributes;
  #optionsFromAttributes;

  constructor() {
    super();
    this.attachShadow({mode: 'open'}).innerHTML = ScreenshotButton.#htmlContent;
  }

  connectedCallback() {
    this.#text = this.attributes.getNamedItem('text')?.value || 'Take screenshot';
    this.#useComputedStyle = !!this.attributes.getNamedItem('use-computed-style');
    this.#removeAttributes = this.attributes.getNamedItem('use-computed-style')?.value?.trim().toLowerCase() === 'remove';
    this.#timeout = this.attributes.getNamedItem('timeout')?.value || '500';
    this.#previewTargetScale = this.attributes.getNamedItem('preview-scale')?.value || '0.5';

    this.#optionsFromAttributes = {
      timeout: this.#timeout,
      isFromInternalEvent: true
    }

    this.#video = this.shadowRoot.getElementById('video');
    this.#canvas = this.shadowRoot.getElementById('canvas');
    const startButton = this.shadowRoot.getElementById('startButton');
    startButton.addEventListener('click', this.takeScreenshot.bind(this, this.#optionsFromAttributes), false);
    startButton.innerText = this.#text;

    if (this.#useComputedStyle) {
      const computedStyle = window.getComputedStyle(this);
      Array.from(computedStyle).forEach(key => startButton.style.setProperty(key, computedStyle.getPropertyValue(key), computedStyle.getPropertyPriority(key)));

      if (this.#removeAttributes) {
        this.removeAttribute('class');
        this.removeAttribute('style');
      }
    }
  }

  /**
   * DOM is not guaranteed to be fully loaded neither in constructor nor connectedCallback hence querying as late as
   * possible is the easiest way.
   * @returns {HTMLImageElement}
   */
  #previewTarget() {
    return document.querySelector(this.attributes.getNamedItem('preview-target')?.value);
  }

  takeScreenshot(options) {
    // Note that there's a second parameter which is an event
    const isFromInternalEvent = options && options.isFromInternalEvent === true;
    const timeout = options?.timeout || this.#optionsFromAttributes.timeout;

    return new Promise((resolve, reject) => {
      // https://github.com/w3c/mediacapture-screen-share/issues/184
      // https://w3c.github.io/mediacapture-screen-share/#dom-displaycapturesurfacetype
      navigator.mediaDevices.getDisplayMedia({video: {cursor: "always", displaySurface: "monitor"}, audio: false})
        .then((stream) => {
          this.#video.srcObject = stream;
          this.#video.play();
          setTimeout(() => {
            const streamSettings = stream.getVideoTracks()[0].getSettings();
            this.#canvas.setAttribute('width', streamSettings.width);
            this.#canvas.setAttribute('height', streamSettings.height);

            const context = this.#canvas.getContext('2d');
            context.drawImage(this.#video, 0, 0, this.#canvas.width, this.#canvas.height);

            this.#canvas.toBlob((blob) => {
              this.#screenshot = blob;
              resolve(blob);
            });

              // Set image to target if defined
              const previewTarget = this.#previewTarget();
              if (isFromInternalEvent && previewTarget instanceof HTMLImageElement) {
                previewTarget.src = this.#canvas.toDataURL('image/png');
                previewTarget.width = this.#canvas.width * this.#previewTargetScale;
                previewTarget.height = this.#canvas.height * this.#previewTargetScale;
              }

            // Clear video
            this.#video.srcObject.getTracks().forEach((track) => track.stop());
            this.#video.srcObject = null;
          }, timeout);
        })
        .catch((err) => {
          console.error(`An error occurred: ${err}`);
          reject(err);
        });
    });
  }

  /**
   * Returns the first instance found in the document
   */
  static instance() {
    return document.querySelector('screenshot-button');
  }
}

window.customElements.define('screenshot-button', ScreenshotButton);

export default ScreenshotButton;

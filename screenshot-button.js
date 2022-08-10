{
    const htmlContent = `
    <style>
      #canvas, #video {
        display: none;
      }
    </style>
    <video id="video">Video stream not available.</video>
    <canvas id="canvas"></canvas>
    <button id="startButton"></button>
  `;

    class ScreenshotButton extends HTMLElement {
      #text;
      #useComputedStyle;
      #timeout;
      #previewTarget;
      #previewTargetScale;
      #video;
      #canvas;
      #screenshot;
      #removeAttributes;

      constructor() {
        super();

        this.#text = this.attributes.getNamedItem('text')?.value || 'Take screenshot';
        this.#useComputedStyle = !!this.attributes.getNamedItem('use-computed-style');
        this.#removeAttributes = this.attributes.getNamedItem('use-computed-style')?.value?.trim().toLowerCase() === 'remove';
        this.#timeout = this.attributes.getNamedItem('timeout')?.value || '500';
        this.#previewTargetScale = this.attributes.getNamedItem('preview-scale')?.value || '0.5';

        this.attachShadow({ mode: 'open' }).innerHTML = htmlContent;
        this.#video = this.shadowRoot.getElementById('video');
        this.#canvas = this.shadowRoot.getElementById('canvas');
        const startButton = this.shadowRoot.getElementById('startButton');
        startButton.addEventListener('click', this.takeScreenshot.bind(this), false);
        startButton.innerText = this.#text;

        if (this.#useComputedStyle) {
          const computedStyle = window.getComputedStyle(this);
          Array.from(computedStyle).forEach(key => startButton.style.setProperty(key, computedStyle.getPropertyValue(key), computedStyle.getPropertyPriority(key)));

          if (this.#removeAttributes) {
            this.removeAttribute('id');
            this.removeAttribute('class');
            this.removeAttribute('style');
          }
        }
      }

      connectedCallback() {
        this.#previewTarget = document.querySelector(this.attributes.getNamedItem('preview-target')?.value);
      }

      takeScreenshot() {
        return new Promise((resolve, reject) => {
          // https://github.com/w3c/mediacapture-screen-share/issues/184
          // https://w3c.github.io/mediacapture-screen-share/#dom-displaycapturesurfacetype
          navigator.mediaDevices.getDisplayMedia({video: {cursor: "always", displaySurface: "monitor"}, audio: false})
          .then( (stream) => {
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
              if (this.#previewTarget instanceof HTMLImageElement) {
                this.#previewTarget.src = this.#canvas.toDataURL('image/png');
                this.#previewTarget.width = this.#canvas.width * this.#previewTargetScale;
                this.#previewTarget.height = this.#canvas.height * this.#previewTargetScale;
              }

              // Clear video
              this.#video.srcObject.getTracks().forEach((track) => track.stop());
              this.#video.srcObject = null;
            }, this.#timeout);
          })
          .catch((err) => {
            console.error(`An error occurred: ${err}`);
            reject(err);
          });
        });
      }
    }

    window.customElements.define('screenshot-button', ScreenshotButton);
  }

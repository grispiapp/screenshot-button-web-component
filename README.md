# Screenshot Button

This is a Web components custom element. See demo and documentation on:

https://grispiapp.github.io/screenshot-button-web-component/

```html
<!--Add to your page-->

<script type="module" src="https://grispiapp.github.io/screenshot-button-web-component/screenshot-button.js"></script>

<!--Declarative usage-->

<screenshot-button></screenshot-button>

<!--Programmatic usage-->

const screenshotButton = document.querySelector('screenshot-button');
screenshotButton.takeScreenshot()
  .then( (blob) => imgEl.src = URL.createObjectURL(blob) )
```

Result is just a `<button>` but with a screenshot capability.

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab.id;

  const savedSettings = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
          return {
              brightness: sessionStorage.getItem('dimmerBrightness') || '0',
              contrast: sessionStorage.getItem('dimmerContrast') || '0',
              enabled: sessionStorage.getItem('dimmerEnabled') === 'true'
          };
      }
  });

  const settings = savedSettings[0].result || { brightness: '0', contrast: '0', enabled: false };

  const brightnessSlider = document.getElementById('brightness-slider');
  const contrastSlider = document.getElementById('contrast-slider');
  const toggleSwitch = document.getElementById('toggle');
  const resetButton = document.getElementById('reset-button');

  brightnessSlider.value = settings.enabled ? settings.brightness : 0;
  contrastSlider.value = settings.enabled ? settings.contrast : 0;

  function applyFilter(enabled, brightness, contrast) {
      if (!enabled) {
          chrome.scripting.executeScript({
              target: { tabId: tabId },
              func: () => {
                  const style = document.getElementById('dimmer-style');
                  if (style) {
                      style.remove();
                  }
                  sessionStorage.setItem('dimmerEnabled', 'false');
              }
          });
          return;
      }
      chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (b, c) => {
              let style = document.getElementById('dimmer-style');
              if (!style) {
                  style = document.createElement('style');
                  style.id = 'dimmer-style';
                  document.head.appendChild(style);
              }
              style.textContent = `html { filter: brightness(${1 + parseFloat(b)}) contrast(${1 + parseFloat(c)}); transition: filter 0.3s ease; }`;
              sessionStorage.setItem('dimmerBrightness', (b).toString());
              sessionStorage.setItem('dimmerContrast', (c).toString());
              sessionStorage.setItem('dimmerEnabled', 'true');
          },
          args: [brightness, contrast]
      });
  }

  applyFilter(settings.enabled, settings.brightness, settings.contrast);

  toggleSwitch.addEventListener('click', () => {
      const isEnabled = !settings.enabled;
      toggleSwitch.classList.toggle('on', isEnabled);
      settings.enabled = isEnabled;

      brightnessSlider.disabled = !isEnabled;
      contrastSlider.disabled = !isEnabled;

      if (isEnabled) {
          applyFilter(true, brightnessSlider.value, contrastSlider.value);
      } else {
          applyFilter(false, brightnessSlider.value, contrastSlider.value);
      }
  });

  brightnessSlider.addEventListener('input', () => {
      if (settings.enabled) {
          applyFilter(true, brightnessSlider.value, contrastSlider.value);
      }
  });

  contrastSlider.addEventListener('input', () => {
      if (settings.enabled) {
          applyFilter(true, brightnessSlider.value, contrastSlider.value);
      }
  });

  resetButton.addEventListener('click', () => {
      brightnessSlider.value = 0;
      contrastSlider.value = 0;
      applyFilter(settings.enabled, 0, 0);
  });
});
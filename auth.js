(() => {
  const gate = document.getElementById('authGate');
  const app = document.getElementById('mainApp');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');

  window.__STUDY_USER__ = null;
  window.__STUDY_STATE__ = null;
  window.__STUDY_AUTH_READY__ = false;

  function showGate(register = false) {
    document.body.classList.remove('auth-loading');
    gate.classList.remove('hidden');
    app.classList.add('hidden');
    loginForm.classList.toggle('hidden', register);
    registerForm.classList.toggle('hidden', !register);
    loginTab.classList.toggle('active', !register);
    registerTab.classList.toggle('active', register);
    title.textContent = register ? 'Create your workspace' : 'Welcome back';
    subtitle.textContent = register
      ? 'Create your account and make Study Tracker yours.'
      : 'Sign in to your private academic workspace.';
  }

  function hideGate() {
    gate.classList.add('hidden');
    app.classList.remove('hidden');
    document.body.classList.remove('auth-loading');
  }

  function setError(el, message) {
    el.textContent = message || '';
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    let body = {};
    try { body = await response.json(); } catch {}
    if (!response.ok) throw new Error(body.error || 'Request failed');
    return body;
  }

  async function bootstrap() {
    try {
      const me = await api('/api/auth/me');
      const stateResult = await api('/api/state');
      window.__STUDY_USER__ = me.user;
      window.__STUDY_STATE__ = stateResult.state;
      window.__STUDY_AUTH_READY__ = true;
      hideGate();
      window.dispatchEvent(new CustomEvent('study-auth-ready', { detail: { state: stateResult.state } }));
    } catch {
      showGate(false);
    }
  }

  loginTab.onclick = () => showGate(false);
  registerTab.onclick = () => showGate(true);

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setError(loginError, '');
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const result = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: document.getElementById('loginUsername').value,
          password: document.getElementById('loginPassword').value
        })
      });
      const stateResult = await api('/api/state');
      window.__STUDY_USER__ = result.user;
      window.__STUDY_STATE__ = stateResult.state;
      window.__STUDY_AUTH_READY__ = true;
      hideGate();
      window.dispatchEvent(new CustomEvent('study-auth-ready', { detail: { state: stateResult.state } }));
    } catch (err) {
      setError(loginError, err.message);
    } finally {
      button.disabled = false;
    }
  });

  let registerAvatar = '';

  document.getElementById('registerPhoto').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      registerAvatar = await resizeImage(file, 320, 0.82);
      document.getElementById('registerAvatar').innerHTML =
        '<img class="avatar" src="' + registerAvatar + '" alt="Profile preview">';
    } catch {
      setError(registerError, 'That profile image could not be processed.');
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setError(registerError, '');
    const button = registerForm.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const result = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: document.getElementById('registerUsername').value,
          password: document.getElementById('registerPassword').value,
          profile: {
            name: document.getElementById('registerName').value,
            institution: document.getElementById('registerInstitution').value,
            city: document.getElementById('registerCity').value,
            program: document.getElementById('registerProgram').value,
            avatar: registerAvatar
          }
        })
      });
      const stateResult = await api('/api/state');
      window.__STUDY_USER__ = result.user;
      window.__STUDY_STATE__ = stateResult.state;
      window.__STUDY_AUTH_READY__ = true;
      hideGate();
      window.dispatchEvent(new CustomEvent('study-auth-ready', { detail: { state: stateResult.state } }));
    } catch (err) {
      setError(registerError, err.message);
    } finally {
      button.disabled = false;
    }
  });

  function resizeImage(file, maxSize, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const image = new Image();
        image.onerror = reject;
        image.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('canvas'));
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  window.studyAuthReady = bootstrap;
  bootstrap();
})();
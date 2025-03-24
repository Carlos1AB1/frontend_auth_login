// Configuración de la API
const API_URL = 'https://spring-security-jwt-login-email.onrender.com';

// Elementos del DOM
const navTabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');

// Variables globales
let authToken = localStorage.getItem('authToken');

// Cambio de pestañas
navTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabId = tab.getAttribute('data-tab');

    // Actualiza clases activas en pestañas
    navTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Actualiza contenido activo
    tabContents.forEach(content => {
      content.classList.remove('active');
      if (content.id === tabId) {
        content.classList.add('active');
      }
    });

    // Si selecciona perfil o usuarios y está autenticado, cargar datos
    if (tabId === 'profile' && authToken) {
      loadUserProfile();
    } else if (tabId === 'users' && authToken) {
      loadAllUsers();
    }
  });
});

// Login
document.getElementById('loginButton').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const messageElement = document.getElementById('loginMessage');

  if (!email || !password) {
    showMessage(messageElement, 'Por favor completa todos los campos', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      showMessage(messageElement, 'Inicio de sesión exitoso', 'success');

      // Cambiar a la pestaña de perfil
      document.querySelector('[data-tab="profile"]').click();
    } else {
      showMessage(messageElement, data.message || 'Error al iniciar sesión', 'error');
    }
  } catch (error) {
    showMessage(messageElement, 'Error de conexión con el servidor', 'error');
    console.error('Error:', error);
  }
});

// Register
document.getElementById('registerButton').addEventListener('click', async () => {
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const messageElement = document.getElementById('registerMessage');

  if (!username || !email || !password) {
    showMessage(messageElement, 'Por favor completa todos los campos', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(messageElement, 'Registro exitoso. Por favor verifica tu cuenta con el código enviado a tu correo.', 'success');

      // Cambiar a la pestaña de verificación
      document.querySelector('[data-tab="verify"]').click();
      document.getElementById('verifyEmail').value = email;
    } else {
      showMessage(messageElement, data.message || 'Error al registrarse', 'error');
    }
  } catch (error) {
    showMessage(messageElement, 'Error de conexión con el servidor', 'error');
    console.error('Error:', error);
  }
});

// Verify
document.getElementById('verifyButton').addEventListener('click', async () => {
  const email = document.getElementById('verifyEmail').value;
  const verificationCode = document.getElementById('verifyCode').value;
  const messageElement = document.getElementById('verifyMessage');

  if (!email || !verificationCode) {
    showMessage(messageElement, 'Por favor completa todos los campos', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, verificationCode })
    });

    if (response.ok) {
      showMessage(messageElement, 'Cuenta verificada exitosamente. Ahora puedes iniciar sesión.', 'success');

      // Cambiar a la pestaña de login
      document.querySelector('[data-tab="login"]').click();
      document.getElementById('loginEmail').value = email;
    } else {
      const data = await response.text();
      showMessage(messageElement, data || 'Error al verificar la cuenta', 'error');
    }
  } catch (error) {
    showMessage(messageElement, 'Error de conexión con el servidor', 'error');
    console.error('Error:', error);
  }
});

// Resend verification code
document.getElementById('resendButton').addEventListener('click', async () => {
  const email = document.getElementById('verifyEmail').value;
  const messageElement = document.getElementById('verifyMessage');

  if (!email) {
    showMessage(messageElement, 'Por favor ingresa tu correo', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/resend?email=${email}`, {
      method: 'POST'
    });

    if (response.ok) {
      showMessage(messageElement, 'Código de verificación reenviado a tu correo', 'success');
    } else {
      const data = await response.text();
      showMessage(messageElement, data || 'Error al reenviar el código', 'error');
    }
  } catch (error) {
    showMessage(messageElement, 'Error de conexión con el servidor', 'error');
    console.error('Error:', error);
  }
});

// Logout
document.getElementById('logoutButton').addEventListener('click', () => {
  authToken = null;
  localStorage.removeItem('authToken');
  document.getElementById('userData').innerHTML = '<p>Inicia sesión para ver tu perfil.</p>';
  document.getElementById('allUsers').innerHTML = '<p>Inicia sesión para ver la lista de usuarios.</p>';

  // Cambiar a la pestaña de login
  document.querySelector('[data-tab="login"]').click();
});

// Cargar perfil de usuario
async function loadUserProfile() {
  if (!authToken) return;

  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const user = await response.json();
      document.getElementById('userData').innerHTML = `
                  <p><strong>ID:</strong> ${user.id}</p>
                  <p><strong>Nombre de Usuario:</strong> ${user.username}</p>
                  <p><strong>Correo:</strong> ${user.email}</p>
              `;
    } else if (response.status === 401) {
      // Token expirado
      authToken = null;
      localStorage.removeItem('authToken');
      document.querySelector('[data-tab="login"]').click();
    }
  } catch (error) {
    console.error('Error al cargar perfil:', error);
  }
}

// Cargar todos los usuarios
async function loadAllUsers() {
  if (!authToken) return;

  try {
    const response = await fetch(`${API_URL}/users/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const users = await response.json();
      const usersElement = document.getElementById('allUsers');

      if (users.length === 0) {
        usersElement.innerHTML = '<p>No hay usuarios registrados.</p>';
        return;
      }

      let html = '';
      users.forEach(user => {
        html += `
                      <div class="user-card">
                          <p><strong>ID:</strong> ${user.id}</p>
                          <p><strong>Usuario:</strong> ${user.username}</p>
                          <p><strong>Correo:</strong> ${user.email}</p>
                      </div>
                  `;
      });

      usersElement.innerHTML = html;
    } else if (response.status === 401) {
      // Token expirado
      authToken = null;
      localStorage.removeItem('authToken');
      document.querySelector('[data-tab="login"]').click();
    }
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
  }
}

// Función para mostrar mensajes
function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `message ${type}`;

  // Auto limpiar después de 5 segundos
  setTimeout(() => {
    element.textContent = '';
    element.className = 'message';
  }, 5000);
}

// Comprobar si hay token guardado e inicializar la interfaz
if (authToken) {
  // Cambiar a la pestaña de perfil si hay token
  document.querySelector('[data-tab="profile"]').click();
}

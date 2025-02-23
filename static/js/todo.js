let currentTab = 'not done';

function selectTab(status) {
  currentTab = status;

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.getElementById(status === 'done' ? 'done' : status === 'not done' ? 'not-done' : 'all').classList.add('active');

  loadTodos(status);
}

async function loadTodos(status = '') {
  try {
    let url = '/api/todos';
    if (status) url += `?status=${status}`;

    const response = await fetch(url);
    const todos = await response.json();

    const tableBody = document.querySelector('#todoTable tbody');
    tableBody.innerHTML = '';

    todos.forEach(todo => {
      const row = document.createElement('tr');

      const titleCell = document.createElement('td');
      titleCell.innerHTML = `<a href="/todo-details.html?id=${todo.id}">${todo.title}</a>`;

      const statusCell = document.createElement('td');
      statusCell.textContent = todo.status;

      const actionsCell = document.createElement('td');
      actionsCell.innerHTML = `
        <form method="POST" action="/update-todo/${todo.id}">
          <select name="status" onchange="this.form.submit()">
            <option value="done" ${todo.status === 'done' ? 'selected' : ''}>Done</option>
            <option value="not done" ${todo.status === 'not done' ? 'selected' : ''}>Not Done</option>
          </select>
        </form>
        <form method="POST" action="/delete-todo/${todo.id}" onsubmit="return confirm('Delete this task?');">
          <button type="submit">Delete</button>
        </form>
      `;

      row.appendChild(titleCell);
      row.appendChild(statusCell);
      row.appendChild(actionsCell);

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading todos:', error);
  }
}

async function logout() {
  try {
    const response = await fetch('/logout', { method: 'GET' });
    if (response.ok) {
      window.location.href = '/login.html';
    } else {
      alert('Failed to logout. Please try again.');
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

window.onload = () => selectTab('not done');

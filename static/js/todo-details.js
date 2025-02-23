const urlParams = new URLSearchParams(window.location.search);
const todoId = urlParams.get('id');

let currentDescription = '';

async function loadTodoDetails() {
  try {
    const [todoResponse, commentsResponse] = await Promise.all([
      fetch(`/api/todos/${todoId}`),
      fetch(`/api/comments/${todoId}`)
    ]);

    if (!todoResponse.ok) throw new Error('Failed to load TODO details');
    if (!commentsResponse.ok) throw new Error('Failed to load comments');

    const todo = await todoResponse.json();
    const comments = await commentsResponse.json();

    document.getElementById('todo-title').textContent = todo.title;
    document.getElementById('todo-description').textContent = todo.description;
    document.getElementById('todo-status').textContent = todo.status;
    currentDescription = todo.description;

    const commentList = document.getElementById('comment-list');
    commentList.innerHTML = '';
    comments.forEach(comment => {
      const li = document.createElement('li');
      li.textContent = comment.text;

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete-button';
      deleteButton.onclick = () => deleteComment(comment.id);

      li.appendChild(deleteButton);
      commentList.appendChild(li);
    });
  } catch (error) {
    console.error('Error loading details or comments:', error);
  }
}

document.getElementById('edit-description-btn').addEventListener('click', () => {
  document.getElementById('description-input').value = currentDescription;
  document.getElementById('edit-description-form').style.display = 'block';
});

document.getElementById('save-description-btn').addEventListener('click', async () => {
  const newDescription = document.getElementById('description-input').value;

  try {
    const response = await fetch(`/api/todos/update-description/${todoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: newDescription })
    });

    if (response.ok) {
      currentDescription = newDescription;
      document.getElementById('todo-description').textContent = newDescription;
      document.getElementById('edit-description-form').style.display = 'none';
    } else {
      alert('Failed to update description.');
    }
  } catch (error) {
    console.error('Error updating description:', error);
  }
});

async function deleteComment(commentId) {
  if (!confirm('Are you sure you want to delete this comment?')) return;

  try {
    const response = await fetch(`/api/comments/delete/${commentId}`, { method: 'POST' });
    if (response.ok) {
      loadTodoDetails();
    } else {
      alert('Failed to delete comment');
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
  }
}

document.getElementById('comment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const comment = document.getElementById('comment').value;

  try {
    const response = await fetch(`/api/comments/${todoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: comment })
    });

    if (response.ok) {
      document.getElementById('comment').value = '';
      loadTodoDetails();
    } else {
      alert('Failed to add comment');
    }
  } catch (error) {
    console.error('Error adding comment:', error);
  }
});

loadTodoDetails();

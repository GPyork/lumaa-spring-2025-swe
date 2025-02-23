import express from 'express';
import mysql from 'mysql2/promise';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3618;

const dbConfig = {
  host: 'cse-mysql-classes-01.cse.umn.edu',
  user: 'C4131F24S002U65',
  password: '4275',
  database: 'C4131F24S002U65',
};
const pool = mysql.createPool(dbConfig);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('static'));

app.use(session({
  secret: 'csci4131secret',
  resave: false,
  saveUninitialized: false,
}));

function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

app.get('/login.html', (req, res) => {
  if (req.session && req.session.userId) {
    res.redirect('/todo.html');
  } else {
    res.sendFile(path.join(__dirname, 'static/html/login.html'));
  }
});

app.get('/create-account.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'static/html/create-account.html'));
});

app.post('/create-account', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Username and password required.');

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.redirect('/login.html');
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.redirect('/create-account.html?error=Username already exists');
    } else {
      console.error(error);
      res.status(500).send('Internal server error.');
    }
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT id, password FROM users WHERE username = ?', [username]);
    if (rows.length > 0 && bcrypt.compareSync(password, rows[0].password)) {
      req.session.userId = rows[0].id;
      req.session.username = username;
      res.redirect('/todo.html');
    } else {
      res.redirect('/login.html?error=Invalid username or password');
    }
  } catch (error) {
    console.error(error);
    res.redirect('/login.html?error=Internal server error');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});
app.get('/todo.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'static/html/todo.html'));
});
app.get('/add-todo.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'static/html/add-todo.html'));
});
app.get('/todo-details.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'static/html/todo-details.html'));
});


app.get('/api/todos', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  const { status } = req.query;

  let query = 'SELECT * FROM todos WHERE user_id = ?';
  const params = [userId];

  if (status === 'done' || status === 'not done') {
    query += ' AND status = ?';
    params.push(status);
  }

  try {
    const [todos] = await pool.query(query, params);
    res.json(todos);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to fetch TODO items');
  }
});

app.get('/api/todos/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const [todo] = await pool.query('SELECT * FROM todos WHERE id = ? AND user_id = ?', [id, userId]);

    if (todo.length === 0) {
      return res.status(404).send('TODO not found');
    }

    res.json(todo[0]);
  } catch (error) {
    console.error('Error fetching TODO details:', error);
    res.status(500).send('Failed to fetch TODO details');
  }
});


app.post('/add-todo', isAuthenticated, async (req, res) => {
  const { title, description } = req.body;
  const userId = req.session.userId;

  try {
    await pool.query(
      'INSERT INTO todos (title, description, user_id) VALUES (?, ?, ?)',
      [title, description, userId]
    );
    res.redirect('/todo.html');
  } catch (error) {
    console.error('Error adding todo:', error);
    res.status(500).send('Failed to add TODO item');
  }
});

app.get('/api/todos/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const [todo] = await pool.query(
      'SELECT * FROM todos WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (todo.length === 0) {
      return res.status(404).send('TODO not found');
    }

    res.json(todo[0]);
  } catch (error) {
    console.error('Error fetching TODO details:', error);
    res.status(500).send('Failed to fetch TODO details');
  }
});


app.post('/api/todos/update-description/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;
  const userId = req.session.userId;

  try {
    await pool.query('UPDATE todos SET description = ? WHERE id = ? AND user_id = ?', [description, id, userId]);
    res.status(200).send('Description updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to update description');
  }
});

app.post('/delete-todo/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    await pool.query('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, userId]);
    res.redirect('/todo.html');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to delete TODO item');
  }
});

app.get('/api/comments/:todoId', isAuthenticated, async (req, res) => {
  const { todoId } = req.params;
  const userId = req.session.userId;

  try {
    const [task] = await pool.query('SELECT id FROM todos WHERE id = ? AND user_id = ?', [todoId, userId]);
    if (task.length === 0) {
      return res.status(403).send('You do not have access to this TODO');
    }

    const [comments] = await pool.query('SELECT * FROM comments WHERE todo_id = ?', [todoId]);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).send('Failed to fetch comments');
  }
});


app.post('/api/comments/:todoId', isAuthenticated, async (req, res) => {
  const { todoId } = req.params;
  const { text } = req.body;
  const userId = req.session.userId;

  try {
    const [task] = await pool.query('SELECT id FROM todos WHERE id = ? AND user_id = ?', [todoId, userId]);
    if (task.length === 0) {
      return res.status(403).send('You cannot add comments to this TODO');
    }

    await pool.query('INSERT INTO comments (todo_id, text) VALUES (?, ?)', [todoId, text]);
    res.status(201).send('Comment added successfully');
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).send('Failed to add comment');
  }
});


app.post('/api/comments/delete/:commentId', isAuthenticated, async (req, res) => {
  const { commentId } = req.params;
  const userId = req.session.userId;

  try {
    const query = `
      DELETE comments
      FROM comments
      JOIN todos ON comments.todo_id = todos.id
      WHERE comments.id = ? AND todos.user_id = ?
    `;
    const [result] = await pool.query(query, [commentId, userId]);

    if (result.affectedRows === 0) {
      return res.status(403).send('You cannot delete this comment');
    }

    res.status(200).send('Comment deleted successfully');
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).send('Failed to delete comment');
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

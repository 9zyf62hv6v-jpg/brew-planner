const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = require('./db');
const { signToken, requireAuth, requireRole } = require('./auth');

const app = express();

app.use(cors());
app.use(express.json());

// ---------- Генератор кода приглашения ----------
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ---------- Хелпер: создаём дефолтные данные для нового владельца ----------
async function seedOwnerData(userId) {
  const locResult = await pool.query(
    `INSERT INTO locations (name, description, user_id)
     VALUES ('Основная', 'Главное производство', $1)
     RETURNING id`,
    [userId]
  );
  const locationId = locResult.rows[0].id;

  await pool.query(
    `INSERT INTO tanks (location_id, name, volume_hl, sort_order, user_id) VALUES
      ($1, 'ЦКТ-01', 60, 1, $2),
      ($1, 'ЦКТ-02', 60, 2, $2),
      ($1, 'ЦКТ-03', 60, 3, $2),
      ($1, 'ЦКТ-04', 60, 4, $2),
      ($1, 'ЦКТ-05', 60, 5, $2),
      ($1, 'ЦКТ-06', 60, 6, $2),
      ($1, 'ЦКТ-07', 120, 7, $2),
      ($1, 'ЦКТ-08', 120, 8, $2),
      ($1, 'ЦКТ-09', 120, 9, $2),
      ($1, 'ЦКТ-10', 120, 10, $2)`,
    [locationId, userId]
  );

  await pool.query(
    `INSERT INTO recipes (name, style, color, user_id) VALUES
      ('Светлый лагер', 'Lager', '#4CAF50', $1),
      ('Вишнёвый эль', 'Cherry Ale', '#B45309', $1),
      ('Hazy IPA', 'IPA', '#E91E63', $1),
      ('Малиновый эль', 'Raspberry Ale', '#2196F3', $1),
      ('Oatmeal Stout', 'Stout', '#607D8B', $1)`,
    [userId]
  );
}

// ============ AUTH ============

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, invite_code } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Заполни email, пароль и имя' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль минимум 6 символов' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }

    const hash = await bcrypt.hash(password, 10);

    if (invite_code) {
      const inv = await pool.query(
        `SELECT * FROM invitations
         WHERE code = $1 AND used = FALSE AND expires_at > NOW()`,
        [invite_code.toUpperCase()]
      );
      if (inv.rowCount === 0) {
        return res.status(400).json({ error: 'Код приглашения недействителен или истёк' });
      }

      const invitation = inv.rows[0];

      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, name, role, owner_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, role, owner_id, created_at`,
        [email.toLowerCase(), hash, name, invitation.role, invitation.owner_id]
      );

      const user = userResult.rows[0];

      await pool.query(
        'UPDATE invitations SET used = TRUE, used_by = $1 WHERE id = $2',
        [user.id, invitation.id]
      );

      const token = signToken(user);
      return res.status(201).json({ token, user });
    }

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'owner')
       RETURNING id, email, name, role, created_at`,
      [email.toLowerCase(), hash, name]
    );

    const user = userResult.rows[0];

    await pool.query('UPDATE users SET owner_id = id WHERE id = $1', [user.id]);
    user.owner_id = user.id;
    user.role = 'owner';

    await seedOwnerData(user.id);

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Введи email и пароль' });
    }

    const result = await pool.query(
      'SELECT id, email, name, role, owner_id, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    delete user.password_hash;
    const token = signToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, owner_id, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
});
// PUT — обновить своё имя
app.put('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Имя не может быть пустым' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Имя слишком длинное' });
    }

    const result = await pool.query(
      `UPDATE users SET name = $1 WHERE id = $2
       RETURNING id, email, name, role, owner_id, created_at`,
      [name.trim(), req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
});

// PUT — сменить пароль
app.put('/api/auth/password', requireAuth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Заполни текущий и новый пароль' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Новый пароль минимум 6 символов' });
    }
    if (new_password.length > 100) {
      return res.status(400).json({ error: 'Пароль слишком длинный' });
    }

    // Получаем текущий хеш
    const userRes = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const ok = await bcrypt.compare(current_password, userRes.rows[0].password_hash);
    if (!ok) {
      return res.status(400).json({ error: 'Текущий пароль неверный' });
    }

    if (current_password === new_password) {
      return res.status(400).json({ error: 'Новый пароль должен отличаться от текущего' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, req.user.id]
    );

    res.json({ success: true, message: 'Пароль обновлён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка смены пароля' });
  }
});
// ============ HEALTH ============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Сервер Brew Clone работает!' });
});
// ============ ДЕМО-РЕЖИМ ============

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedDemoData(userId) {
  // 1. Площадка
  const locResult = await pool.query(
    `INSERT INTO locations (name, description, user_id)
     VALUES ('Основная площадка', 'Главное производство', $1)
     RETURNING id`,
    [userId]
  );
  const locationId = locResult.rows[0].id;

  // 2. ЦКТ — 12 штук (8 по 60 гл, 4 по 120 гл)
  const tankValues = [];
  const tankParams = [];
  for (let i = 1; i <= 12; i++) {
    const base = (i - 1) * 5;
    tankValues.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
    tankParams.push(
      locationId,
      `ЦКТ-${String(i).padStart(2, '0')}`,
      i <= 8 ? 60 : 120,
      i,
      userId
    );
  }
  const tanksResult = await pool.query(
    `INSERT INTO tanks (location_id, name, volume_hl, sort_order, user_id)
     VALUES ${tankValues.join(',')}
     RETURNING id`,
    tankParams
  );
  const tankIds = tanksResult.rows.map((r) => r.id);

  // 3. Рецепты — 8 штук
  const recipesData = [
    ['Светлый лагер', 'Lager', '#4CAF50', 'Классический чистый лагер с мягкой горечью', 1.048, 1.010, 22, 5.0],
    ['Hazy IPA', 'IPA', '#E91E63', 'Сочная мутная IPA с тропическими нотами', 1.062, 1.014, 55, 6.3],
    ['Oatmeal Stout', 'Stout', '#607D8B', 'Плотный стаут с овсяными и кофейными нотами', 1.058, 1.018, 38, 5.3],
    ['Вишнёвый эль', 'Cherry Ale', '#B45309', 'Фруктовый эль с добавлением вишни', 1.052, 1.012, 18, 5.3],
    ['Малиновый эль', 'Raspberry Ale', '#2196F3', 'Освежающий эль с малиной', 1.050, 1.011, 20, 5.1],
    ['Пшеничное', 'Hefeweizen', '#FF9800', 'Немецкое пшеничное с банановыми нотами', 1.052, 1.012, 15, 5.3],
    ['West Coast IPA', 'IPA', '#9C27B0', 'Классическая американская IPA', 1.065, 1.012, 65, 7.0],
    ['Портер', 'Porter', '#795548', 'Тёмный портер с шоколадными нотами', 1.055, 1.015, 35, 5.3],
  ];
  const recipeValues = [];
  const recipeParams = [];
  recipesData.forEach((r, i) => {
    const base = i * 12;
    recipeValues.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12})`
    );
    recipeParams.push(...r, 5400, 60, 75, userId);
  });
  const recipesResult = await pool.query(
    `INSERT INTO recipes (name, style, color, description, og, fg, ibu, abv, volume_l, boil_time_min, efficiency, user_id)
     VALUES ${recipeValues.join(',')}
     RETURNING id`,
    recipeParams
  );
  const recipeIds = recipesResult.rows.map((r) => r.id);

  // 4. Варки — 12 штук (5 done, 3 active, 4 planned)
  const batchesData = [
    // Прошлые — done
    { r: 0, t: 0, start: 36, dur: 4, status: 'done', vol: 5400 },
    { r: 3, t: 1, start: 36, dur: 4, status: 'done', vol: 5400 },
    { r: 4, t: 2, start: 37, dur: 4, status: 'done', vol: 5400 },
    { r: 5, t: 3, start: 37, dur: 3, status: 'done', vol: 5400 },
    { r: 2, t: 4, start: 39, dur: 5, status: 'done', vol: 5400 },
    // Текущие — active
    { r: 0, t: 5, start: 42, dur: 4, status: 'active', vol: 5400, bot: 46 },
    { r: 6, t: 9, start: 42, dur: 5, status: 'active', vol: 10800, bot: 47 },
    { r: 1, t: 10, start: 43, dur: 4, status: 'active', vol: 10800, bot: 47 },
    // Планы — planned
    { r: 3, t: 6, start: 44, dur: 4, status: 'planned', vol: 5400, bot: 48 },
    { r: 7, t: 7, start: 45, dur: 4, status: 'planned', vol: 5400, bot: 49 },
    { r: 5, t: 8, start: 46, dur: 3, status: 'planned', vol: 5400, bot: 49 },
    { r: 6, t: 11, start: 47, dur: 4, status: 'planned', vol: 10800, bot: 51 },
  ];
  const batchValues = [];
  const batchParams = [];
  batchesData.forEach((b, i) => {
    const base = i * 9;
    batchValues.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`
    );
    batchParams.push(
      recipeIds[b.r],
      tankIds[b.t],
      b.vol,
      b.start,
      b.start + b.dur - 1,
      b.status,
      b.bot || null,
      b.status === 'done' ? b.vol : null,
      userId
    );
  });
  await pool.query(
    `INSERT INTO batches
       (recipe_id, tank_id, volume_l, start_week, end_week, status,
        bottling_week, bottling_volume_l, user_id)
     VALUES ${batchValues.join(',')}`,
    batchParams
  );

  // 5. Задачи — 6 штук
  const tasksData = [
    ['Помыть ЦКТ-01', 'Кислотная мойка перед следующей варкой', 'high', 3],
    ['Принять солод Пэйл-эль', '500 кг от поставщика', 'normal', 1],
    ['Проверить pH воды', 'Замерить и записать в журнал', 'low', 5],
    ['Заказать хмель Cascade', 'Заканчивается — осталось 5 кг', 'high', 2],
    ['Перебрать кеги', 'Проверить на герметичность', 'normal', 7],
    ['Согласовать поставку бутылок', '500 шт 0.5 л', 'normal', 10],
  ];
  const taskValues = [];
  const taskParams = [];
  tasksData.forEach((t, i) => {
    const base = i * 8;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + t[3]);
    taskValues.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`);
    taskParams.push(
      t[0],                     // title
      t[1],                     // description
      t[2],                     // priority
      dueDate.toISOString().slice(0, 10), // due_date
      null,                     // batch_id
      null,                     // assigned_to
      userId,                   // created_by  👈 НОВОЕ
      userId                    // user_id
    );
  });
  await pool.query(
    `INSERT INTO tasks (title, description, priority, due_date, batch_id, assigned_to, created_by, user_id)
     VALUES ${taskValues.join(',')}`,
    taskParams
  );
}

// POST /api/auth/demo — создать демо-аккаунт
app.post('/api/auth/demo', async (req, res) => {
  try {
    const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const email = `demo-${suffix}@demo.brewclone.local`;
    const password = `demo_${suffix}`;

    const hash = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'owner')
       RETURNING id, email, name, role, created_at`,
      [email, hash, 'Демо-пивовар']
    );
    const user = userResult.rows[0];

    await pool.query('UPDATE users SET owner_id = id WHERE id = $1', [user.id]);
    user.owner_id = user.id;

    await seedDemoData(user.id);

    const token = signToken(user);
    res.status(201).json({ token, user, demo: true });
  } catch (err) {
    console.error('Ошибка создания демо:', err);
    res.status(500).json({ error: 'Не удалось создать демо-аккаунт' });
  }
});
// ============ КОМАНДА ============

app.get('/api/team', requireAuth, async (req, res) => {
  try {
    const ownerId = req.user.owner_id;
    const result = await pool.query(
      `SELECT id, email, name, role, created_at
       FROM users
       WHERE owner_id = $1
       ORDER BY
         CASE WHEN id = $1 THEN 0 ELSE 1 END,
         created_at`,
      [ownerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения команды' });
  }
});

app.get('/api/team/invitations', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, code, role, used, used_by, created_at, expires_at
       FROM invitations
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [req.user.owner_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения приглашений' });
  }
});

app.post('/api/team/invite', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['brewer', 'viewer'];
    const finalRole = allowedRoles.includes(role) ? role : 'brewer';

    let code;
    for (let i = 0; i < 5; i++) {
      code = generateInviteCode();
      const check = await pool.query(
        'SELECT id FROM invitations WHERE code = $1',
        [code]
      );
      if (check.rowCount === 0) break;
      if (i === 4) {
        return res.status(500).json({ error: 'Не удалось сгенерировать код' });
      }
    }

    const result = await pool.query(
      `INSERT INTO invitations (code, owner_id, role)
       VALUES ($1, $2, $3)
       RETURNING id, code, role, used, created_at, expires_at`,
      [code, req.user.owner_id, finalRole]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания приглашения' });
  }
});

app.delete(
  '/api/team/invitations/:id',
  requireAuth,
  requireRole('owner'),
  async (req, res) => {
    try {
      const result = await pool.query(
        'DELETE FROM invitations WHERE id = $1 AND owner_id = $2',
        [req.params.id, req.user.owner_id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Приглашение не найдено' });
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка удаления приглашения' });
    }
  }
);

app.delete(
  '/api/team/:id',
  requireAuth,
  requireRole('owner'),
  async (req, res) => {
    try {
      const targetId = Number(req.params.id);
      if (targetId === req.user.id) {
        return res.status(400).json({ error: 'Нельзя удалить самого себя' });
      }

      const result = await pool.query(
        'DELETE FROM users WHERE id = $1 AND owner_id = $2 AND id != owner_id',
        [targetId, req.user.owner_id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Сотрудник не найден' });
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка удаления сотрудника' });
    }
  }
);

// ============ СПРАВОЧНИКИ ============

app.get('/api/locations', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM locations WHERE user_id = $1 ORDER BY id',
      [req.user.owner_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения площадок' });
  }
});

app.get('/api/tanks', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tanks WHERE user_id = $1 ORDER BY sort_order',
      [req.user.owner_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения танков' });
  }
});

// ============ РЕЦЕПТЫ (расширенная версия) ============

// Хелпер: валидация ингредиента
function validateIngredient(ing) {
  const validTypes = ['malt', 'hop', 'yeast', 'other'];
  if (!validTypes.includes(ing.type)) {
    return `Неверный тип ингредиента: ${ing.type}`;
  }
  if (!ing.name || typeof ing.name !== 'string' || ing.name.trim().length === 0) {
    return 'У ингредиента должно быть название';
  }
  if (typeof ing.amount !== 'number' || ing.amount < 0) {
    return 'Количество ингредиента должно быть неотрицательным числом';
  }
  if (!ing.unit || typeof ing.unit !== 'string') {
    return 'У ингредиента должна быть единица измерения';
  }
  return null;
}

// Хелпер: загрузка ингредиентов для нескольких рецептов сразу
async function loadIngredientsForRecipes(recipeIds) {
  if (recipeIds.length === 0) return {};
  const result = await pool.query(
    `SELECT * FROM recipe_ingredients
     WHERE recipe_id = ANY($1::int[])
     ORDER BY type, sort_order, id`,
    [recipeIds]
  );
  const byRecipe = {};
  recipeIds.forEach((id) => { byRecipe[id] = []; });
  result.rows.forEach((ing) => {
    if (byRecipe[ing.recipe_id]) byRecipe[ing.recipe_id].push(ing);
  });
  return byRecipe;
}

// GET — список всех рецептов с ингредиентами
app.get('/api/recipes', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM recipes WHERE user_id = $1 ORDER BY id',
      [req.user.owner_id]
    );
    const ids = result.rows.map((r) => r.id);
    const ingredientsMap = await loadIngredientsForRecipes(ids);
    const recipes = result.rows.map((r) => ({
      ...r,
      ingredients: ingredientsMap[r.id] || [],
    }));
    res.json(recipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения рецептов' });
  }
});

// GET — один рецепт с ингредиентами
app.get('/api/recipes/:id', requireAuth, async (req, res) => {
  try {
    const recipeResult = await pool.query(
      'SELECT * FROM recipes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.owner_id]
    );
    if (recipeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Рецепт не найден' });
    }
    const recipe = recipeResult.rows[0];
    const ingResult = await pool.query(
      `SELECT * FROM recipe_ingredients
       WHERE recipe_id = $1
       ORDER BY type, sort_order, id`,
      [recipe.id]
    );
    res.json({ ...recipe, ingredients: ingResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения рецепта' });
  }
});

// POST — создание рецепта с ингредиентами (транзакция)
app.post('/api/recipes', requireAuth, requireRole('owner', 'brewer'), async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      name, style, color, description,
      og, fg, ibu, abv,
      volume_l, boil_time_min, efficiency,
      ingredients,
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Название рецепта обязательно' });
    }

    if (Array.isArray(ingredients)) {
      for (const ing of ingredients) {
        const err = validateIngredient(ing);
        if (err) return res.status(400).json({ error: err });
      }
    }

    await client.query('BEGIN');

    const recipeResult = await client.query(
      `INSERT INTO recipes
         (name, style, color, description,
          og, fg, ibu, abv,
          volume_l, boil_time_min, efficiency, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        name.trim(), style || null, color || '#4CAF50', description || null,
        og || null, fg || null, ibu || null, abv || null,
        volume_l || 5400, boil_time_min || 60, efficiency || 75,
        req.user.owner_id,
      ]
    );
    const recipe = recipeResult.rows[0];

    if (Array.isArray(ingredients) && ingredients.length > 0) {
      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i];
        await client.query(
          `INSERT INTO recipe_ingredients
             (recipe_id, type, name, amount, unit,
              color_ebc, potential_sg, alpha_acid, boil_time_min, attenuation, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            recipe.id, ing.type, ing.name.trim(), ing.amount, ing.unit,
            ing.color_ebc || null, ing.potential_sg || null,
            ing.alpha_acid || null, ing.boil_time_min || null,
            ing.attenuation || null, i,
          ]
        );
      }
    }

    await client.query('COMMIT');

    const ingResult = await pool.query(
      `SELECT * FROM recipe_ingredients
       WHERE recipe_id = $1
       ORDER BY type, sort_order, id`,
      [recipe.id]
    );
    res.status(201).json({ ...recipe, ingredients: ingResult.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания рецепта' });
  } finally {
    client.release();
  }
});

// PUT — обновление рецепта (полная замена ингредиентов)
app.put('/api/recipes/:id', requireAuth, requireRole('owner', 'brewer'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      name, style, color, description,
      og, fg, ibu, abv,
      volume_l, boil_time_min, efficiency,
      ingredients,
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Название рецепта обязательно' });
    }

    if (Array.isArray(ingredients)) {
      for (const ing of ingredients) {
        const err = validateIngredient(ing);
        if (err) return res.status(400).json({ error: err });
      }
    }

    const check = await client.query(
      'SELECT id FROM recipes WHERE id = $1 AND user_id = $2',
      [id, req.user.owner_id]
    );
    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'Рецепт не найден' });
    }

    await client.query('BEGIN');

    const recipeResult = await client.query(
      `UPDATE recipes
       SET name = $1, style = $2, color = $3, description = $4,
           og = $5, fg = $6, ibu = $7, abv = $8,
           volume_l = $9, boil_time_min = $10, efficiency = $11
       WHERE id = $12 AND user_id = $13
       RETURNING *`,
      [
        name.trim(), style || null, color || '#4CAF50', description || null,
        og || null, fg || null, ibu || null, abv || null,
        volume_l || 5400, boil_time_min || 60, efficiency || 75,
        id, req.user.owner_id,
      ]
    );
    const recipe = recipeResult.rows[0];

    // Удаляем старые ингредиенты и вставляем новые
    await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);

    if (Array.isArray(ingredients) && ingredients.length > 0) {
      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i];
        await client.query(
          `INSERT INTO recipe_ingredients
             (recipe_id, type, name, amount, unit,
              color_ebc, potential_sg, alpha_acid, boil_time_min, attenuation, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            recipe.id, ing.type, ing.name.trim(), ing.amount, ing.unit,
            ing.color_ebc || null, ing.potential_sg || null,
            ing.alpha_acid || null, ing.boil_time_min || null,
            ing.attenuation || null, i,
          ]
        );
      }
    }

    await client.query('COMMIT');

    const ingResult = await pool.query(
      `SELECT * FROM recipe_ingredients
       WHERE recipe_id = $1
       ORDER BY type, sort_order, id`,
      [recipe.id]
    );
    res.json({ ...recipe, ingredients: ingResult.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления рецепта' });
  } finally {
    client.release();
  }
});

// DELETE — удаление рецепта (только owner)
app.delete('/api/recipes/:id', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM recipes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.owner_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Рецепт не найден' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления рецепта' });
  }
});
// ============ ЗАДАЧИ ============

// GET — список задач (с фильтрами)
app.get('/api/tasks', requireAuth, async (req, res) => {
  try {
    const { status, assigned_to } = req.query;
    const params = [req.user.owner_id];
    let where = 'WHERE t.user_id = $1';

    if (status === 'todo' || status === 'done') {
      params.push(status);
      where += ` AND t.status = $${params.length}`;
    }
    if (assigned_to) {
      params.push(Number(assigned_to));
      where += ` AND t.assigned_to = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT
         t.id, t.title, t.description, t.status, t.priority,
         t.due_date, t.created_at, t.completed_at,
         t.batch_id,
         b.start_week AS batch_start_week,
         b.end_week   AS batch_end_week,
         r.name       AS batch_recipe_name,
         r.color      AS batch_recipe_color,
         t.assigned_to,
         u.name AS assigned_to_name,
         t.created_by,
         cu.name AS created_by_name
       FROM tasks t
       LEFT JOIN batches b ON t.batch_id = b.id
       LEFT JOIN recipes r ON b.recipe_id = r.id
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users cu ON t.created_by = cu.id
       ${where}
       ORDER BY
         CASE WHEN t.status = 'todo' THEN 0 ELSE 1 END,
         CASE t.priority
           WHEN 'high' THEN 0
           WHEN 'normal' THEN 1
           WHEN 'low' THEN 2
           ELSE 3
         END,
         t.due_date NULLS LAST,
         t.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения задач' });
  }
});

// POST — создать задачу
app.post('/api/tasks', requireAuth, async (req, res) => {
  try {
    const { title, description, priority, due_date, batch_id, assigned_to } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Название задачи обязательно' });
    }

    const allowedPriorities = ['low', 'normal', 'high'];
    const finalPriority = allowedPriorities.includes(priority) ? priority : 'normal';

    // Проверка batch_id — принадлежит нашему owner'у
    if (batch_id) {
      const bCheck = await pool.query(
        'SELECT id FROM batches WHERE id = $1 AND user_id = $2',
        [batch_id, req.user.owner_id]
      );
      if (bCheck.rowCount === 0) {
        return res.status(400).json({ error: 'Варка не найдена' });
      }
    }

    // Проверка assigned_to — тоже из нашей команды
    if (assigned_to) {
      const uCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND owner_id = $2',
        [assigned_to, req.user.owner_id]
      );
      if (uCheck.rowCount === 0) {
        return res.status(400).json({ error: 'Сотрудник не найден' });
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks
         (title, description, priority, due_date, batch_id, assigned_to,
          created_by, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title.trim(),
        description || null,
        finalPriority,
        due_date || null,
        batch_id || null,
        assigned_to || null,
        req.user.id,
        req.user.owner_id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания задачи' });
  }
});

// PUT — обновить задачу
app.put('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, priority, due_date, batch_id, assigned_to, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Название задачи обязательно' });
    }

    const allowedPriorities = ['low', 'normal', 'high'];
    const finalPriority = allowedPriorities.includes(priority) ? priority : 'normal';
    const finalStatus = status === 'done' ? 'done' : 'todo';

    const result = await pool.query(
      `UPDATE tasks
       SET title = $1, description = $2, priority = $3, due_date = $4,
           batch_id = $5, assigned_to = $6, status = $7,
           completed_at = CASE WHEN $7 = 'done' THEN now() ELSE NULL END
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        title.trim(),
        description || null,
        finalPriority,
        due_date || null,
        batch_id || null,
        assigned_to || null,
        finalStatus,
        req.params.id,
        req.user.owner_id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления задачи' });
  }
});

// PATCH — быстрый toggle статуса
app.patch('/api/tasks/:id/toggle', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE tasks
       SET status = CASE WHEN status = 'done' THEN 'todo' ELSE 'done' END,
           completed_at = CASE WHEN status = 'todo' THEN now() ELSE NULL END
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.owner_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка переключения статуса' });
  }
});

// DELETE — удалить задачу
app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.owner_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления задачи' });
  }
});
// ============ ПРОДУКЦИЯ ============

const PRODUCT_TYPES = ['keg', 'bottle', 'can'];

// GET — вся продукция с данными варки
app.get('/api/products', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         p.id, p.type, p.package_volume_l, p.quantity, p.location,
         p.bottled_at, p.notes, p.created_at,
         p.batch_id,
         r.name  AS recipe_name,
         r.color AS recipe_color,
         b.start_week, b.end_week,
         (p.package_volume_l * p.quantity) AS total_volume_l
       FROM products p
       LEFT JOIN batches b ON p.batch_id = b.id
       LEFT JOIN recipes r ON b.recipe_id = r.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.owner_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения продукции' });
  }
});

// POST — создать партию продукции
app.post('/api/products', requireAuth, requireRole('owner', 'brewer'), async (req, res) => {
  try {
    const { batch_id, type, package_volume_l, quantity, location, bottled_at, notes } = req.body;

    if (!batch_id || !type || !package_volume_l || !quantity) {
      return res.status(400).json({ error: 'Заполни варку, тип, объём и количество' });
    }
    if (!PRODUCT_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Неверный тип упаковки' });
    }
    if (Number(quantity) <= 0 || Number(package_volume_l) <= 0) {
      return res.status(400).json({ error: 'Объём и количество должны быть положительными' });
    }

    const bCheck = await pool.query(
      'SELECT id FROM batches WHERE id = $1 AND user_id = $2',
      [batch_id, req.user.owner_id]
    );
    if (bCheck.rowCount === 0) {
      return res.status(400).json({ error: 'Варка не найдена' });
    }

    const result = await pool.query(
      `INSERT INTO products
         (batch_id, type, package_volume_l, quantity, location, bottled_at, notes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        batch_id, type, Number(package_volume_l), Number(quantity),
        location || null, bottled_at || null, notes || null,
        req.user.owner_id,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания продукции' });
  }
});

// PUT — обновить партию
app.put('/api/products/:id', requireAuth, requireRole('owner', 'brewer'), async (req, res) => {
  try {
    const { batch_id, type, package_volume_l, quantity, location, bottled_at, notes } = req.body;

    if (!batch_id || !type || !package_volume_l || !quantity) {
      return res.status(400).json({ error: 'Заполни варку, тип, объём и количество' });
    }
    if (!PRODUCT_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Неверный тип упаковки' });
    }
    if (Number(quantity) <= 0 || Number(package_volume_l) <= 0) {
      return res.status(400).json({ error: 'Объём и количество должны быть положительными' });
    }

    const result = await pool.query(
      `UPDATE products
       SET batch_id = $1, type = $2, package_volume_l = $3, quantity = $4,
           location = $5, bottled_at = $6, notes = $7
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        batch_id, type, Number(package_volume_l), Number(quantity),
        location || null, bottled_at || null, notes || null,
        req.params.id, req.user.owner_id,
      ]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Партия не найдена' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления продукции' });
  }
});

// DELETE — удалить партию
app.delete('/api/products/:id', requireAuth, requireRole('owner', 'brewer'), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.owner_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Партия не найдена' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления продукции' });
  }
});
// ============ ИЗМЕРЕНИЯ (QA-журнал) ============

// Хелпер: валидация измерения
function validateMeasurement(data) {
  const { ph, gravity, temperature, pressure, volume_l } = data;

  if (ph !== null && ph !== undefined && ph !== '') {
    const p = Number(ph);
    if (!Number.isFinite(p) || p < 0 || p > 14) {
      return 'pH должен быть числом от 0 до 14';
    }
  }
  if (gravity !== null && gravity !== undefined && gravity !== '') {
    const g = Number(gravity);
    if (!Number.isFinite(g) || g < 0.99 || g > 1.2) {
      return 'Плотность должна быть в диапазоне 0.990 – 1.200';
    }
  }
  if (temperature !== null && temperature !== undefined && temperature !== '') {
    const t = Number(temperature);
    if (!Number.isFinite(t) || t < -10 || t > 100) {
      return 'Температура должна быть в диапазоне -10 – 100 °C';
    }
  }
  if (pressure !== null && pressure !== undefined && pressure !== '') {
    const p = Number(pressure);
    if (!Number.isFinite(p) || p < 0 || p > 10) {
      return 'Давление должно быть от 0 до 10 бар';
    }
  }
  if (volume_l !== null && volume_l !== undefined && volume_l !== '') {
    const v = Number(volume_l);
    if (!Number.isFinite(v) || v < 0) {
      return 'Объём должен быть положительным числом';
    }
  }
  return null;
}

// GET — все измерения конкретной варки
app.get('/api/batches/:id/measurements', requireAuth, async (req, res) => {
  try {
    // Проверим, что варка принадлежит нашему владельцу
    const batchCheck = await pool.query(
      'SELECT id FROM batches WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.owner_id]
    );
    if (batchCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Варка не найдена' });
    }

    const result = await pool.query(
      `SELECT id, batch_id, measured_at, ph, gravity, temperature,
              pressure, volume_l, notes, created_at
       FROM measurements
       WHERE batch_id = $1 AND user_id = $2
       ORDER BY measured_at DESC`,
      [req.params.id, req.user.owner_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения измерений' });
  }
});

// POST — добавить измерение
app.post(
  '/api/batches/:id/measurements',
  requireAuth,
  requireRole('owner', 'brewer'),
  async (req, res) => {
    try {
      const { measured_at, ph, gravity, temperature, pressure, volume_l, notes } = req.body;

      // Проверка варки
      const batchCheck = await pool.query(
        'SELECT id FROM batches WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.owner_id]
      );
      if (batchCheck.rowCount === 0) {
        return res.status(404).json({ error: 'Варка не найдена' });
      }

      // Валидация значений
      const err = validateMeasurement({ ph, gravity, temperature, pressure, volume_l });
      if (err) return res.status(400).json({ error: err });

      const result = await pool.query(
        `INSERT INTO measurements
           (batch_id, measured_at, ph, gravity, temperature, pressure, volume_l, notes, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          req.params.id,
          measured_at || new Date(),
          ph || null,
          gravity || null,
          temperature || null,
          pressure || null,
          volume_l || null,
          notes || null,
          req.user.owner_id,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка создания измерения' });
    }
  }
);

// PUT — обновить измерение
app.put(
  '/api/measurements/:id',
  requireAuth,
  requireRole('owner', 'brewer'),
  async (req, res) => {
    try {
      const { measured_at, ph, gravity, temperature, pressure, volume_l, notes } = req.body;

      const err = validateMeasurement({ ph, gravity, temperature, pressure, volume_l });
      if (err) return res.status(400).json({ error: err });

      const result = await pool.query(
        `UPDATE measurements
         SET measured_at = $1, ph = $2, gravity = $3,
             temperature = $4, pressure = $5, volume_l = $6, notes = $7
         WHERE id = $8 AND user_id = $9
         RETURNING *`,
        [
          measured_at || new Date(),
          ph || null,
          gravity || null,
          temperature || null,
          pressure || null,
          volume_l || null,
          notes || null,
          req.params.id,
          req.user.owner_id,
        ]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Измерение не найдено' });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка обновления измерения' });
    }
  }
);

// DELETE — удалить измерение
app.delete(
  '/api/measurements/:id',
  requireAuth,
  requireRole('owner', 'brewer'),
  async (req, res) => {
    try {
      const result = await pool.query(
        'DELETE FROM measurements WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.owner_id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Измерение не найдено' });
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка удаления измерения' });
    }
  }
);

// GET — экспорт измерений варки в CSV
app.get('/api/batches/:id/measurements/export.csv', requireAuth, async (req, res) => {
  try {
    const batchCheck = await pool.query(
      `SELECT b.id, r.name AS recipe_name
       FROM batches b
       LEFT JOIN recipes r ON b.recipe_id = r.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [req.params.id, req.user.owner_id]
    );
    if (batchCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Варка не найдена' });
    }

    const result = await pool.query(
      `SELECT measured_at, ph, gravity, temperature, pressure, volume_l, notes
       FROM measurements
       WHERE batch_id = $1 AND user_id = $2
       ORDER BY measured_at`,
      [req.params.id, req.user.owner_id]
    );

    // Формируем CSV
    const header = 'Дата,pH,Плотность,Температура (°C),Давление (бар),Объём (л),Заметки';
    const rows = result.rows.map((m) => {
      const date = new Date(m.measured_at).toISOString().slice(0, 19).replace('T', ' ');
      const escape = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      };
      return [
        date,
        escape(m.ph),
        escape(m.gravity),
        escape(m.temperature),
        escape(m.pressure),
        escape(m.volume_l),
        escape(m.notes),
      ].join(',');
    });

    const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM для Excel + русский
    // Имя файла только ASCII — HTTP-заголовки не принимают кириллицу
// Используем RFC 5987: ASCII-fallback + UTF-8 в filename*
const recipeName = batchCheck.rows[0].recipe_name || `batch-${req.params.id}`;
const asciiName = recipeName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
const utf8Name = encodeURIComponent(`measurements-${recipeName}.csv`);

res.setHeader('Content-Type', 'text/csv; charset=utf-8');
res.setHeader(
  'Content-Disposition',
  `attachment; filename="measurements-${asciiName}.csv"; filename*=UTF-8''${utf8Name}`
);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка экспорта' });
  }
});
// ============ ВАРКИ ============

async function checkConflict({ tank_id, start_week, end_week, volume_l, excludeId = 0, ownerId }) {
  const tankResult = await pool.query(
    'SELECT volume_hl FROM tanks WHERE id = $1 AND user_id = $2',
    [tank_id, ownerId]
  );
  if (tankResult.rowCount === 0) {
    return 'Танк не найден';
  }
  const tankVolumeL = tankResult.rows[0].volume_hl * 100;

  if (Number(volume_l) > tankVolumeL) {
    return `Объём варки (${volume_l} л) превышает объём танка (${tankVolumeL} л)`;
  }

  const conflicts = await pool.query(
    `SELECT id, start_week, end_week
     FROM batches
     WHERE tank_id = $1
       AND user_id = $2
       AND id != $3
       AND NOT (end_week < $4 OR start_week > $5)`,
    [tank_id, ownerId, excludeId, start_week, end_week]
  );

  if (conflicts.rowCount > 0) {
    const c = conflicts.rows[0];
    return `Танк занят другой варкой в этот период (недели ${c.start_week}–${c.end_week})`;
  }

  return null;
}

// Хелпер: валидация полей розлива
function validateBottling({ bottling_week, bottling_volume_l, start_week, end_week }) {
  if (bottling_week === undefined || bottling_week === null || bottling_week === '') {
    return null;
  }
  const bw = Number(bottling_week);
  if (!Number.isInteger(bw) || bw < 36 || bw > 52) {
    return 'Неделя розлива должна быть в диапазоне 36–52';
  }
  if (bw < Number(end_week)) {
    return 'Неделя розлива должна быть не раньше окончания варки';
  }
  if (
    bottling_volume_l !== undefined &&
    bottling_volume_l !== null &&
    bottling_volume_l !== ''
  ) {
    const bv = Number(bottling_volume_l);
    if (!Number.isFinite(bv) || bv < 0) {
      return 'Объём розлива должен быть положительным числом';
    }
  }
  return null;
}

app.get('/api/batches', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        b.id, b.volume_l, b.start_week, b.end_week, b.status, b.notes,
        b.bottling_week, b.bottling_volume_l,
        t.id   AS tank_id,
        t.name AS tank_name,
        t.volume_hl,
        r.id     AS recipe_id,
        r.name   AS recipe_name,
        r.style  AS recipe_style,
        r.color  AS recipe_color
      FROM batches b
      LEFT JOIN tanks t   ON b.tank_id = t.id
      LEFT JOIN recipes r ON b.recipe_id = r.id
      WHERE b.user_id = $1
      ORDER BY b.start_week, t.sort_order
      `,
      [req.user.owner_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения варок' });
  }
});

app.post(
  '/api/batches',
  requireAuth,
  requireRole('owner', 'brewer'),
  async (req, res) => {
    try {
      const {
        recipe_id, tank_id, volume_l, start_week, end_week, status,
        bottling_week, bottling_volume_l,
      } = req.body;

      if (!recipe_id || !tank_id || !volume_l || !start_week || !end_week) {
        return res.status(400).json({ error: 'Заполни все обязательные поля' });
      }

      if (Number(end_week) < Number(start_week)) {
        return res.status(400).json({ error: 'Дата окончания раньше даты начала' });
      }

      const rCheck = await pool.query(
        'SELECT id FROM recipes WHERE id = $1 AND user_id = $2',
        [recipe_id, req.user.owner_id]
      );
      if (rCheck.rowCount === 0) {
        return res.status(403).json({ error: 'Рецепт не найден' });
      }
      const tCheck = await pool.query(
        'SELECT id FROM tanks WHERE id = $1 AND user_id = $2',
        [tank_id, req.user.owner_id]
      );
      if (tCheck.rowCount === 0) {
        return res.status(403).json({ error: 'Танк не найден' });
      }

      const conflict = await checkConflict({
        tank_id,
        start_week: Number(start_week),
        end_week: Number(end_week),
        volume_l: Number(volume_l),
        ownerId: req.user.owner_id,
      });
      if (conflict) {
        return res.status(409).json({ error: conflict });
      }

      const bErr = validateBottling({
        bottling_week, bottling_volume_l, start_week, end_week,
      });
      if (bErr) {
        return res.status(400).json({ error: bErr });
      }

      const result = await pool.query(
        `INSERT INTO batches
           (recipe_id, tank_id, volume_l, start_week, end_week, status,
            bottling_week, bottling_volume_l, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          recipe_id, tank_id, volume_l, start_week, end_week,
          status || 'planned',
          bottling_week || null, bottling_volume_l || null,
          req.user.owner_id,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка создания варки' });
    }
  }
);

app.put(
  '/api/batches/:id',
  requireAuth,
  requireRole('owner', 'brewer'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        recipe_id, tank_id, volume_l, start_week, end_week, status,
        bottling_week, bottling_volume_l,
      } = req.body;

      if (!recipe_id || !tank_id || !volume_l || !start_week || !end_week) {
        return res.status(400).json({ error: 'Заполни все обязательные поля' });
      }

      if (Number(end_week) < Number(start_week)) {
        return res.status(400).json({ error: 'Дата окончания раньше даты начала' });
      }

      const conflict = await checkConflict({
        tank_id,
        start_week: Number(start_week),
        end_week: Number(end_week),
        volume_l: Number(volume_l),
        excludeId: Number(id),
        ownerId: req.user.owner_id,
      });
      if (conflict) {
        return res.status(409).json({ error: conflict });
      }

      const bErr = validateBottling({
        bottling_week, bottling_volume_l, start_week, end_week,
      });
      if (bErr) {
        return res.status(400).json({ error: bErr });
      }

      const result = await pool.query(
        `UPDATE batches
           SET recipe_id = $1,
               tank_id = $2,
               volume_l = $3,
               start_week = $4,
               end_week = $5,
               status = $6,
               bottling_week = $7,
               bottling_volume_l = $8
         WHERE id = $9 AND user_id = $10
         RETURNING *`,
        [
          recipe_id, tank_id, volume_l, start_week, end_week, status,
          bottling_week || null, bottling_volume_l || null,
          id, req.user.owner_id,
        ]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Варка не найдена' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка обновления варки' });
    }
  }
);

app.delete(
  '/api/batches/:id',
  requireAuth,
  requireRole('owner'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        'DELETE FROM batches WHERE id = $1 AND user_id = $2',
        [id, req.user.owner_id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Варка не найдена' });
      }

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка удаления варки' });
    }
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
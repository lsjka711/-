const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// 中间件配置
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.JWT_SECRET || 'book-management-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
}));

// 数据库连接配置
const db = require('./config/database');

// 路由配置
const { router: authRoutes, requireAuth } = require('./routes/auth');
const bookRoutes = require('./routes/books');
const categoryRoutes = require('./routes/categories');
const borrowingRoutes = require('./routes/borrowings');
const reviewRoutes = require('./routes/reviews');
const favoriteRoutes = require('./routes/favorites');

// 公共路由
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

// 需要认证的路由
app.use('/api/categories', requireAuth, categoryRoutes);
app.use('/api/borrowings', requireAuth, borrowingRoutes);
app.use('/api/reviews', requireAuth, reviewRoutes);
app.use('/api/favorites', requireAuth, favoriteRoutes);

// 搜索图书
app.get('/api/search', async (req, res) => {
    const { query } = req.query;
    try {
        const [books] = await db.query(
            `SELECT b.*, c.name as category_name 
             FROM books b 
             LEFT JOIN categories c ON b.category_id = c.id 
             WHERE b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?`,
            [`%${query}%`, `%${query}%`, `%${query}%`]
        );
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: '搜索失败' });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('服务器出错了！');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}); 
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 获取用户的借阅记录
router.get('/my', async (req, res) => {
    try {
        const [borrowings] = await db.query(`
            SELECT b.*, books.title, books.author 
            FROM borrowings b
            JOIN books ON b.book_id = books.id
            WHERE b.user_id = ?
            ORDER BY b.borrow_date DESC
        `, [req.session.userId]);
        res.json(borrowings);
    } catch (error) {
        console.error('获取借阅记录失败:', error);
        res.status(500).json({ message: '获取借阅记录失败' });
    }
});

// 借书
router.post('/', async (req, res) => {
    const { bookId } = req.body;
    const userId = req.session.userId;

    try {
        // 检查图书是否存在且有库存
        const [books] = await db.query(
            'SELECT * FROM books WHERE id = ? AND stock > 0',
            [bookId]
        );

        if (books.length === 0) {
            return res.status(400).json({ message: '功能暂未开放' });
        }

        // 检查用户是否已借此书
        const [existing] = await db.query(
            'SELECT * FROM borrowings WHERE user_id = ? AND book_id = ? AND status = "borrowed"',
            [userId, bookId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: '你已经借阅了这本书' });
        }

        // 设置借阅期限（默认30天）
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // 开始事务
        await db.query('START TRANSACTION');

        // 创建借阅记录
        await db.query(
            'INSERT INTO borrowings (user_id, book_id, due_date) VALUES (?, ?, ?)',
            [userId, bookId, dueDate]
        );

        // 更新库存
        await db.query(
            'UPDATE books SET stock = stock - 1 WHERE id = ?',
            [bookId]
        );

        // 提交事务
        await db.query('COMMIT');

        res.status(201).json({ message: '借阅成功' });
    } catch (error) {
        // 回滚事务
        await db.query('ROLLBACK');
        console.error('借书失败:', error);
        res.status(500).json({ message: '借书失败' });
    }
});

module.exports = router; 
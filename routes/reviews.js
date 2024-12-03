const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 获取图书的所有评论
router.get('/book/:bookId', async (req, res) => {
    try {
        const [reviews] = await db.query(`
            SELECT r.*, u.username 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.book_id = ? 
            ORDER BY r.created_at DESC
        `, [req.params.bookId]);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: '获取评论失败' });
    }
});

// 添加评论
router.post('/book/:bookId', async (req, res) => {
    const { rating, content } = req.body;
    const user_id = req.session.userId;
    const book_id = req.params.bookId;

    try {
        // 检查用户是否已评论过此书
        const [existing] = await db.query(
            'SELECT * FROM reviews WHERE user_id = ? AND book_id = ?',
            [user_id, book_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: '你已经评论过这本书' });
        }

        // 检查评分范围
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: '评分必须在1-5之间' });
        }

        const [result] = await db.query(
            'INSERT INTO reviews (book_id, user_id, rating, content) VALUES (?, ?, ?, ?)',
            [book_id, user_id, rating, content]
        );

        res.status(201).json({
            id: result.insertId,
            message: '评论添加成功'
        });
    } catch (error) {
        res.status(500).json({ message: '添加评论失败' });
    }
});

// 修改评论
router.put('/:id', async (req, res) => {
    const { rating, content } = req.body;
    const user_id = req.session.userId;

    try {
        // 检查评论是否存在且属于当前用户
        const [reviews] = await db.query(
            'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
            [req.params.id, user_id]
        );

        if (reviews.length === 0) {
            return res.status(404).json({ message: '评论不存在或无权修改' });
        }

        // 检查评分范围
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: '评分必须在1-5之间' });
        }

        await db.query(
            'UPDATE reviews SET rating = ?, content = ? WHERE id = ?',
            [rating, content, req.params.id]
        );

        res.json({ message: '评论更新成功' });
    } catch (error) {
        res.status(500).json({ message: '更新评论失败' });
    }
});

// 删除评论
router.delete('/:id', async (req, res) => {
    const user_id = req.session.userId;

    try {
        // 检查评论是否存在且属于当前用户
        const [reviews] = await db.query(
            'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
            [req.params.id, user_id]
        );

        if (reviews.length === 0) {
            return res.status(404).json({ message: '评论不存在或无权删除' });
        }

        await db.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
        res.json({ message: '评论删除成功' });
    } catch (error) {
        res.status(500).json({ message: '删除评论失败' });
    }
});

// 获取用户的所有评论
router.get('/user/me', async (req, res) => {
    try {
        const [reviews] = await db.query(`
            SELECT r.*, b.title as book_title 
            FROM reviews r 
            JOIN books b ON r.book_id = b.id 
            WHERE r.user_id = ? 
            ORDER BY r.created_at DESC
        `, [req.session.userId]);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: '获取评论失败' });
    }
});

module.exports = router; 
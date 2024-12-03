const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 获取用户的所有收藏夹
router.get('/', async (req, res) => {
    try {
        const [favorites] = await db.query(
            'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
            [req.session.userId]
        );
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ message: '获取收藏夹列表失败' });
    }
});

// 获取收藏夹详情及其图书
router.get('/:id', async (req, res) => {
    try {
        // 获取收藏夹信息
        const [favorites] = await db.query(
            'SELECT * FROM favorites WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );

        if (favorites.length === 0) {
            return res.status(404).json({ message: '收藏夹不存在' });
        }

        // 获取收藏夹中的图书
        const [books] = await db.query(`
            SELECT b.*, fb.added_at 
            FROM books b 
            JOIN favorite_books fb ON b.id = fb.book_id 
            WHERE fb.favorite_id = ? 
            ORDER BY fb.added_at DESC
        `, [req.params.id]);

        const favorite = favorites[0];
        favorite.books = books;

        res.json(favorite);
    } catch (error) {
        res.status(500).json({ message: '获取收藏夹详情失败' });
    }
});

// 创建新收藏夹
router.post('/', async (req, res) => {
    const { name, description } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO favorites (user_id, name, description) VALUES (?, ?, ?)',
            [req.session.userId, name, description]
        );
        res.status(201).json({
            id: result.insertId,
            message: '收藏夹创建成功'
        });
    } catch (error) {
        res.status(500).json({ message: '创建收藏夹失败' });
    }
});

// 更新收藏夹信息
router.put('/:id', async (req, res) => {
    const { name, description } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE favorites SET name = ?, description = ? WHERE id = ? AND user_id = ?',
            [name, description, req.params.id, req.session.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '收藏夹不存在或无权修改' });
        }
        res.json({ message: '收藏夹更新成功' });
    } catch (error) {
        res.status(500).json({ message: '更新收藏夹失败' });
    }
});

// 删除收藏夹
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM favorites WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '收藏夹不存在或无权删除' });
        }
        res.json({ message: '收藏夹删除成功' });
    } catch (error) {
        res.status(500).json({ message: '删除收藏夹失败' });
    }
});

// 添加图书到收藏夹
router.post('/:id/books', async (req, res) => {
    const { book_id } = req.body;
    try {
        // 检查收藏夹是否存在且属于当前用户
        const [favorites] = await db.query(
            'SELECT * FROM favorites WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );

        if (favorites.length === 0) {
            return res.status(404).json({ message: '收藏夹不存在或无权访问' });
        }

        // 检查图书是否已在收藏夹中
        const [existing] = await db.query(
            'SELECT * FROM favorite_books WHERE favorite_id = ? AND book_id = ?',
            [req.params.id, book_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: '该图书已在收藏夹中' });
        }

        await db.query(
            'INSERT INTO favorite_books (favorite_id, book_id) VALUES (?, ?)',
            [req.params.id, book_id]
        );

        res.status(201).json({ message: '图书添加到收藏夹成功' });
    } catch (error) {
        res.status(500).json({ message: '添加图书到收藏夹失败' });
    }
});

// 从收藏夹移除图书
router.delete('/:id/books/:bookId', async (req, res) => {
    try {
        // 检查收藏夹是否存在且属于当前用户
        const [favorites] = await db.query(
            'SELECT * FROM favorites WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );

        if (favorites.length === 0) {
            return res.status(404).json({ message: '收藏夹不存在或无权访问' });
        }

        await db.query(
            'DELETE FROM favorite_books WHERE favorite_id = ? AND book_id = ?',
            [req.params.id, req.params.bookId]
        );

        res.json({ message: '从收藏夹移除图书成功' });
    } catch (error) {
        res.status(500).json({ message: '从收藏夹移除图书失败' });
    }
});

module.exports = router; 
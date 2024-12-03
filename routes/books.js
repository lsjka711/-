const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireAdmin } = require('./auth');

// 获取所有图书 - 公开访问
router.get('/', async (req, res) => {
    try {
        const [books] = await db.query('SELECT * FROM books');
        console.log('获取到的图书列表:', books);
        res.json(books);
    } catch (error) {
        console.error('获取图书列表失败:', error);
        res.status(500).json({ message: '获取图书列表失败', error: error.message });
    }
});

// 获取单本图书 - 公开访问
router.get('/:id', async (req, res) => {
    try {
        const [books] = await db.query(`
            SELECT b.*, c.name as category_name 
            FROM books b 
            LEFT JOIN categories c ON b.category_id = c.id 
            WHERE b.id = ?
        `, [req.params.id]);

        if (books.length === 0) {
            return res.status(404).json({ message: '图书不存在' });
        }

        res.json(books[0]);
    } catch (error) {
        console.error('获取图书详情失败:', error);
        res.status(500).json({ message: '获取图书详情失败' });
    }
});

// 添加图书（需要管理员权限）
router.post('/', requireAdmin, async (req, res) => {
    const {
        title,
        author,
        category_id,
        isbn,
        publisher,
        publish_date,
        price,
        stock,
        description,
        cover_url
    } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO books (
                title, author, category_id, isbn, publisher, 
                publish_date, price, stock, description, cover_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, author, category_id, isbn, publisher, publish_date, price, stock, description, cover_url]
        );

        res.status(201).json({
            id: result.insertId,
            message: '图书添加成功'
        });
    } catch (error) {
        console.error('添加图书失败:', error);
        res.status(500).json({ message: '添加图书失败' });
    }
});

// 更新图书（需要管理员权限）
router.put('/:id', requireAdmin, async (req, res) => {
    const {
        title,
        author,
        category_id,
        isbn,
        publisher,
        publish_date,
        price,
        stock,
        description,
        cover_url
    } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE books SET 
                title = ?, author = ?, category_id = ?, isbn = ?, 
                publisher = ?, publish_date = ?, price = ?, 
                stock = ?, description = ?, cover_url = ?
            WHERE id = ?`,
            [title, author, category_id, isbn, publisher, publish_date, price, stock, description, cover_url, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '图书不存在' });
        }

        res.json({ message: '图书更新成功' });
    } catch (error) {
        console.error('更新图书失败:', error);
        res.status(500).json({ message: '更新图书失败' });
    }
});

// 删除图书（需要管理员权限）
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM books WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '图书不存在' });
        }

        res.json({ message: '图书删除成功' });
    } catch (error) {
        console.error('删除图书失败:', error);
        res.status(500).json({ message: '删除图书失败' });
    }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAdmin } = require('./auth');

// 获取所有分类
router.get('/', async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: '获取分类列表失败' });
    }
});

// 获取单个分类及其图书
router.get('/:id', async (req, res) => {
    try {
        // 获取分类信息
        const [categories] = await db.query(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );

        if (categories.length === 0) {
            return res.status(404).json({ message: '分类不存在' });
        }

        // 获取该分类下的所有图书
        const [books] = await db.query(
            'SELECT * FROM books WHERE category_id = ?',
            [req.params.id]
        );

        const category = categories[0];
        category.books = books;

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: '获取分类详情失败' });
    }
});

// 创建新分类（需要管理员权限）
router.post('/', requireAdmin, async (req, res) => {
    const { name, description } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description]
        );
        res.status(201).json({
            id: result.insertId,
            message: '分类创建成功'
        });
    } catch (error) {
        res.status(500).json({ message: '创建分类失败' });
    }
});

// 更新分类（需要管理员权限）
router.put('/:id', requireAdmin, async (req, res) => {
    const { name, description } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE categories SET name = ?, description = ? WHERE id = ?',
            [name, description, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '分类不存在' });
        }
        res.json({ message: '分类更新成功' });
    } catch (error) {
        res.status(500).json({ message: '更新分类失败' });
    }
});

// 删除分类（需要管理员权限）
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '分类不存在' });
        }
        res.json({ message: '分类删除成功' });
    } catch (error) {
        res.status(500).json({ message: '删除分类失败' });
    }
});

module.exports = router; 
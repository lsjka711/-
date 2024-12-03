# 图书管理系统设计文档

## 1. 系统概述

### 1.1 项目背景
本项目是一个基于Node.js和MySQL的图书管理系统，旨在提供一个现代化、易用的图书管理平台。系统支持图书的管理、借阅、评论等功能，并实现了用户权限控制和个性化服务。
### 1.2 系统目标
- 提供图书信息的管理功能
- 实现图书借阅和归还流程
- 支持用户评论和收藏功能
- 提供分类管理和搜索功能
- 实现用户权限控制

## 2. 系统架构

### 2.1 技术架构
- 前端：HTML5 + CSS3 + JavaScript
- 后端：Node.js + Express.js
- 数据库：MySQL
- 会话管理：express-session
- 安全：bcryptjs（密码加密）
- 跨域：cors

### 2.2 系统模块
1. 用户管理模块
   - 用户注册
   - 用户登录
   - 密码修改
   - 权限控制

2. 图书管理模块
   - 图书信息管理
   - 图书分类管理
   - 库存管理
   - 图书搜索

3. 借阅管理模块
   - 借书
   - 还书
   - 续借
   - 借阅历史

4. 评论系统模块
   - 发表评论
   - 评分
   - 评论管理

5. 收藏夹模块
   - 创建收藏夹
   - 收藏图书
   - 收藏夹管理

## 3. 项目结构

```
book-management/
├── config/                 # 配置文件目录
│   └── database.js        # 数据库配置
├── routes/                # 路由文件目录
│   ├── auth.js           # 用户认证路由
│   ├── books.js          # 图书管理路由
│   ├── categories.js     # 分类管理路由
│   ├── borrowings.js     # 借阅管理路由
│   ├── reviews.js        # 评论管理路由
│   └── favorites.js      # 收藏夹管理路由
├── public/               # 静态资源目录
│   ├── index.html       # 主页面
│   ├── styles.css       # 样式文件
│   ├── app.js          # 前端逻辑
│   └── images/         # 图片资源
├── app.js               # 应用入口文件
├── init.sql            # 数据库初始化脚本
├── .env                # 环境变量配置
└── DESIGN.md           # 设计文档

主要文件说明：

1. 配置文件
   - database.js：数据库连接配置
   - .env：环境变量配置

2. 路由文件
   - auth.js：用户认证相关路由
   - books.js：图书管理相关路由
   - categories.js：分类管理相关路由
   - borrowings.js：借阅管理相关路由
   - reviews.js：评论管理相关路由
   - favorites.js：收藏夹管理相关路由

3. 静态资源
   - index.html：主页面HTML
   - styles.css：样式表
   - app.js：前端JavaScript代码
   - images/：图片资源目录

4. 核心文件
   - app.js：应用程序入口
   - init.sql：数据库初始化SQL
   - package.json：项目配置和依赖
```

## 4. API设计

### 4.1 认证接口
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- POST /api/auth/logout - 退出登录
- GET /api/auth/me - 获取当前用户信息
- PUT /api/auth/password - 修改密码

### 4.2 图书接口
- GET /api/books - 获取图书列表
- GET /api/books/:id - 获取图书详情
- POST /api/books - 添加图书
- PUT /api/books/:id - 更新图书
- DELETE /api/books/:id - 删除图书
- PATCH /api/books/:id/stock - 更新库存

### 4.3 分类接口
- GET /api/categories - 获取分类列表
- GET /api/categories/:id - 获取分类详情
- POST /api/categories - 创建分类
- PUT /api/categories/:id - 更新分类
- DELETE /api/categories/:id - 删除分类

### 4.4 借阅接口
- GET /api/borrowings - 获取借阅记录
- GET /api/borrowings/my - 获取个人借阅记录
- POST /api/borrowings - 借书
- POST /api/borrowings/:id/return - 还书
- POST /api/borrowings/:id/renew - 续借
- GET /api/borrowings/overdue - 获取逾期记录

### 4.5 评论接口
- GET /api/reviews/book/:bookId - 获取图书评论
- POST /api/reviews/book/:bookId - 添加评论
- PUT /api/reviews/:id - 修改评论
- DELETE /api/reviews/:id - 删除评论

### 4.6 收藏夹接口
- GET /api/favorites - 获取收藏夹列表
- GET /api/favorites/:id - 获取收藏夹详情
- POST /api/favorites - 创建收藏夹
- PUT /api/favorites/:id - 更新收藏夹
- DELETE /api/favorites/:id - 删除收藏夹
- POST /api/favorites/:id/books - 添加图书到收藏夹
- DELETE /api/favorites/:id/books/:bookId - 从收藏夹移除图书

## 5. 安全设计

### 5.1 用户认证
- 使用session进行用户会话管理
- 密码使用bcrypt进行加密存储
- 实现基于角色的访问控制（RBAC）

### 5.2 数据安全
- 输入验证和过滤
- SQL注入防护
- XSS防护
- CSRF防护

### 5.3 权限控制
- 普通用户权限
  - 浏览图书
  - 借阅图书
  - 评论图书
  - 管理个人收藏夹
  
- 管理员权限
  - 图书管理
  - 分类管理
  - 用户管理
  - 借阅管理

## 6. 前端设计

### 6.1 页面布局
- 响应式设计
- 导航栏
- 主内容区
- 模态框
- 消息提示

### 6.2 交互设计
- 实时搜索
- 表单验证
- 状态反馈
- 加载动画
- 错误处理

### 6.3 样式设计
- 配色方案
- 字体设计
- 组件样式
- 动画效果

## 7. 性能优化

### 7.1 前端优化
- 资源压缩
- 懒加载
- 缓存策略
- 防抖和节流

### 7.2 后端优化
- 数据库索引
- 查询优化
- 连接池
- 缓存机制

## 8. 部署方案

### 8.1 环境要求
- Node.js >= 14.0.0
- MySQL >= 5.7
- 现代浏览器支持

### 8.2 部署步骤
1. 安装依赖
2. 配置环境变量
3. 初始化数据库
4. 启动服务器
5. 配置反向代理

### 8.3 维护计划
- 定期备份
- 日志监控
- 性能监控
- 安全更新

## 9. 测试计划

### 9.1 单元测试
- 接口测试
- 数据库操作测试
- 工具函数测试

### 9.2 集成测试
- 功能流程测试
- 权限测试
- 并发测试

### 9.3 性能测试
- 负载测试
- 压力测试
- 并发测试

## 10. 项目进度

### 10.1 开发阶段
1. 需求分析和设计（1周）
2. 数据库设计和实现（1周）
3. 后端开发（2周）
4. 前端开发（2周）
5. 测试和优化（1周）

### 10.2 维护阶段
- 定期更新
- Bug修复
- 功能优化
- 性能优化

## 11. 技术难点

### 11.1 并发控制
- 库存管理
- 借阅状态
- 数据一致性

### 11.2 性能优化
- 大数据量处理
- 搜索优化
- 缓存策略

### 11.3 安全性
- 权限控制
- 数据加密
- 攻击防护

## 12. 扩展性

### 12.1 功能扩展
- 电子书支持
- 预约功能
- 推荐系统
- 统计分析

### 12.2 架构扩展
- 微服务架构
- 分布式部署
- 容器化部署

## 13. 总结

本设计文档详细描述了图书管理系统的各个方面，包括系统架构、项目结构、API接口、安全措施等。系统采用现代化的技术栈，实现了完整的图书管理功能，并具有良好的可扩展性和维护性。通过合理的设计和实现，系统能够满足图书管理的各项需求，为用户提供便捷的使用体验。 
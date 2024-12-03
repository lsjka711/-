document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const mainContent = document.getElementById('mainContent');
    const homeLink = document.getElementById('homeLink');
    const booksLink = document.getElementById('booksLink');
    const categoriesLink = document.getElementById('categoriesLink');
    const borrowingsLink = document.getElementById('borrowingsLink');
    const favoritesLink = document.getElementById('favoritesLink');

    // 检查用户登录状态
    async function checkAuth() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const user = await response.json();
                showUserInfo(user);
                return true;
            } else {
                showAuthButtons();
                return false;
            }
        } catch (error) {
            console.error('检查登录状态失败:', error);
            showAuthButtons();
            return false;
        }
    }

    // 显示用户信息
    function showUserInfo(user) {
        document.getElementById('authButtons').classList.add('d-none');
        document.getElementById('userInfo').classList.remove('d-none');
        document.getElementById('username').textContent = user.username;
        document.getElementById('username').dataset.role = user.role;

        // 根据用户角色显示/隐藏管理员功能
        const adminElements = document.querySelectorAll('.admin-only');
        if (user.role === 'admin') {
            adminElements.forEach(el => el.classList.remove('d-none'));
        } else {
            adminElements.forEach(el => el.classList.add('d-none'));
        }
    }

    // 显示登录/注册按钮
    function showAuthButtons() {
        document.getElementById('authButtons').classList.remove('d-none');
        document.getElementById('userInfo').classList.add('d-none');
        document.getElementById('username').textContent = '';
    }

    // 路由处理
    const routes = {
        home: () => showHome(),
        books: () => showBooks(),
        categories: () => showCategories(),
        borrowings: () => showBorrowings(),
        favorites: () => showFavorites()
    };

    // 导航事件监听
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        routes.home();
    });

    booksLink.addEventListener('click', (e) => {
        e.preventDefault();
        routes.books();
    });

    categoriesLink.addEventListener('click', (e) => {
        e.preventDefault();
        routes.categories();
    });

    borrowingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        routes.borrowings();
    });

    favoritesLink.addEventListener('click', (e) => {
        e.preventDefault();
        routes.favorites();
    });

    // 显示首页
    async function showHome() {
        mainContent.innerHTML = `
            <div class="jumbotron text-center">
                <h1 class="display-4">欢迎来到图书管理系统</h1>
                <p class="lead">在这里你可以浏览、借阅和管理图书</p>
                <hr class="my-4">
                <p>开始探索我们丰富的图书资源吧！</p>
                <p>使用admin账号登录可访问管理员相关功能</p>
                <p>增删改查仅在使用admin登录在图书列表中进行</p>
                <p>使用user账号登录访问普通用户功能</p>
                <button class="btn btn-primary btn-lg" onclick="routes.books()">浏览图书</button>
            </div>
        `;
    }

    // 检查用户是否登录
    window.isLoggedIn = function() {
        return localStorage.getItem('token') !== null;
    }

    // 显示图书列表
    async function showBooks() {
        mainContent.innerHTML = '<div class="loading">加载中...</div>';
        try {
            const response = await fetch('/api/books', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const books = await response.json();

            let html = `
                <div class="book-list">
                    <div class="search-bar mb-4">
                        <input type="text" class="form-control" id="searchInput" placeholder="搜索图书...">
                    </div>
                    <div class="row" id="booksList">
            `;

            if (books.length === 0) {
                html += '<div class="col-12"><p class="text-center">暂无图书</p></div>';
            } else {
                books.forEach(book => {
                    const isAvailable = book.stock > 0;
                    html += `
                        <div class="col-md-6 col-lg-4 mb-4" data-book-id="${book.id}">
                            <div class="card h-100">
                                <img src="${book.cover_url || 'https://pic3.zhimg.com/v2-5fb13110e1de13d4c11e6e7f5b8026da_r.jpg'}" 
                                     class="card-img-top" alt="${book.title}"
                                     style="height: 200px; object-fit: cover;">
                                <div class="card-body">
                                    <h5 class="card-title">${book.title}</h5>
                                    <p class="card-text">作者：${book.author}</p>
                                    <p class="card-text">ISBN：${book.isbn || '暂无'}</p>
                                    <p class="card-text">
                                        库存：<span class="badge ${isAvailable ? 'bg-success' : 'bg-danger'}">
                                            ${book.stock || 0}
                                        </span>
                                    </p>
                                </div>
                                <div class="card-footer">
                                    <button class="btn btn-primary btn-sm" onclick="borrowBook(${book.id})" 
                                            ${!isAvailable ? 'disabled' : ''}>
                                        ${isAvailable ? '借阅' : '暂无库存'}
                                    </button>
                                    <button class="btn btn-info btn-sm" onclick="showBookDetails(${book.id})">详情</button>
                                    ${isLoggedIn() ? `
                                        <button class="btn btn-outline-warning btn-sm" onclick="addToFavorite(${book.id})">
                                            <i class="fas fa-heart"></i> 收藏
                                        </button>
                                        <button class="btn btn-outline-secondary btn-sm" onclick="showBookReviews(${book.id})">
                                            <i class="fas fa-comment"></i> 评论
                                        </button>
                                    ` : ''}
                                    ${isAdmin() ? `
                                        <button class="btn btn-warning btn-sm" onclick="editBook(${book.id})">编辑</button>
                                        <button class="btn btn-danger btn-sm" onclick="deleteBook(${book.id})">删除</button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                });
            }

            html += `
                    </div>
                </div>
            `;

            if (isAdmin()) {
                html += `
                    <button class="btn btn-primary btn-floating" onclick="showAddBookModal()">
                        <i class="fas fa-plus"></i>
                    </button>
                `;
            }

            mainContent.innerHTML = html;

            // 添加搜索功能
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', debounce(handleSearch, 500));
            }

        } catch (error) {
            console.error('加载图书列表失败:', error);
            mainContent.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    加载图书列表失败: ${error.message}
                    <button class="btn btn-link" onclick="showBooks()">重试</button>
                </div>
            `;
        }
    }

    // 生成图书HTML
    function generateBookHtml(book) {
        return `
            <div class="book-item">
                <img src="${book.cover_url || 'https://via.placeholder.com/120x160'}" alt="${book.title}" class="book-cover">
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">作者：${book.author}</p>
                    <p class="book-meta">
                        分类：${book.category_name || '未分类'} | 
                        ISBN：${book.isbn} | 
                        出版社：${book.publisher || '未知'} | 
                        库存：${book.stock}
                    </p>
                    <p class="book-description">${book.description || '暂无描述'}</p>
                </div>
                <div class="book-actions">
                    <button class="btn btn-primary btn-sm" onclick="borrowBook(${book.id})">借阅</button>
                    <button class="btn btn-outline-primary btn-sm" onclick="showBookReviews(${book.id})">评论</button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="addToFavorite(${book.id})">收藏</button>
                    ${isAdmin() ? `
                        <button class="btn btn-outline-warning btn-sm" onclick="editBook(${book.id})">编辑</button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteBook(${book.id})">删除</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // 显示分类管理
    async function showCategories() {
        mainContent.innerHTML = '<div class="loading">加载中...</div>';
        try {
            const response = await fetch('/api/categories', {
                credentials: 'include'
            });

            if (response.status === 401) {
                mainContent.innerHTML = `
                    <div class="alert alert-warning text-center" role="alert">
                        <h4 class="alert-heading">未登录</h4>
                        <p>请先登录后再访问分类管理</p>
                        <hr>
                        <button class="btn btn-primary" onclick="showLoginModal()">登录</button>
                        <button class="btn btn-outline-primary" onclick="showRegisterModal()">注册</button>
                    </div>
                `;
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const categories = await response.json();
            
            let html = `
                <div class="container">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>分类管理</h2>
                        ${isAdmin() ? `
                            <button class="btn btn-primary" onclick="showAddCategoryModal()">
                                <i class="fas fa-plus"></i> 添加分类
                            </button>
                        ` : ''}
                    </div>
                    ${categories.length === 0 ? '<p class="text-center">暂无分类</p>' : ''}
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>名称</th>
                                    <th>描述</th>
                                    <th>创建时间</th>
                                    ${isAdmin() ? '<th>操作</th>' : ''}
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            categories.forEach(category => {
                html += `
                    <tr>
                        <td>${category.id}</td>
                        <td>${category.name}</td>
                        <td>${category.description || '暂无描述'}</td>
                        <td>${new Date(category.created_at).toLocaleString()}</td>
                        ${isAdmin() ? `
                            <td>
                                <button class="btn btn-sm btn-outline-primary me-2" onclick="editCategory(${category.id})">
                                    <i class="fas fa-edit"></i> 编辑
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${category.id})">
                                    <i class="fas fa-trash"></i> 删除
                                </button>
                            </td>
                        ` : ''}
                    </tr>
                `;
            });
            
            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = html;
        } catch (error) {
            console.error('加载分类列表失败:', error);
            mainContent.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    加载分类列表失败: ${error.message}
                    <button class="btn btn-link" onclick="showCategories()">重试</button>
                </div>
            `;
        }
    }

    // 显示添加分类模态框
    window.showAddCategoryModal = function() {
        const modal = new bootstrap.Modal(document.getElementById('addCategoryModal'));
        document.getElementById('addCategoryForm').reset();
        modal.show();
    }

    // 添加分类
    window.addCategory = async function() {
        const form = document.getElementById('addCategoryForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // 表单验证
        if (!validateCategoryForm(data)) {
            return;
        }

        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                alert('分类添加成功！');
                const modal = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
                modal.hide();
                form.reset();
                showCategories(); // 刷新分类列表
            } else {
                alert(result.message || '添加分类失败，请重试');
            }
        } catch (error) {
            console.error('添加分类失败:', error);
            alert('添加分类失败，请重试');
        }
    }

    // 编辑分类
    window.editCategory = async function(categoryId) {
        try {
            const response = await fetch(`/api/categories/${categoryId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const category = await response.json();
            
            // 填充表单
            const form = document.getElementById('addCategoryForm');
            form.querySelector('input[name="name"]').value = category.name;
            form.querySelector('textarea[name="description"]').value = category.description || '';
            
            // 修改模态框标题和按钮
            const modal = document.getElementById('addCategoryModal');
            modal.querySelector('.modal-title').textContent = '编辑分类';
            const submitButton = modal.querySelector('.modal-footer .btn-primary');
            submitButton.textContent = '保存';
            submitButton.onclick = () => updateCategory(categoryId);
            
            // 显示模态框
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();
        } catch (error) {
            console.error('获取分类详情失败:', error);
            alert('获取分类详情失败，请重试');
        }
    }

    // 更新分类
    async function updateCategory(categoryId) {
        const form = document.getElementById('addCategoryForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (!validateCategoryForm(data)) {
            return;
        }

        try {
            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                alert('分类更新成功！');
                const modal = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
                modal.hide();
                showCategories();
            } else {
                alert(result.message || '更新分类失败，请重试');
            }
        } catch (error) {
            console.error('更新分类失败:', error);
            alert('更新分类失败，请重试');
        }
    }

    // 删除分类
    window.deleteCategory = async function(categoryId) {
        if (!confirm('确定要删除这个分类吗？删除后无法恢复，且会影响相关图书的分类。')) {
            return;
        }

        try {
            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                alert('分类删除成功！');
                showCategories();
            } else {
                const result = await response.json();
                alert(result.message || '删除分类失败，请重试');
            }
        } catch (error) {
            console.error('删除分类失败:', error);
            alert('删除分类失败，请重试');
        }
    }

    // 分类表单验证
    function validateCategoryForm(data) {
        if (!data.name) {
            alert('请输入分类名称');
            return false;
        }

        if (data.name.length < 2 || data.name.length > 50) {
            alert('分类名称长度必须在2-50个字符之间');
            return false;
        }

        if (data.description && data.description.length > 500) {
            alert('分类描述不能超过500个字符');
            return false;
        }

        return true;
    }

    // 显示借阅管理
    async function showBorrowings() {
        mainContent.innerHTML = '<div class="loading">加载中...</div>';
        try {
            const response = await fetch('/api/borrowings/my', {
                credentials: 'include'
            });

            if (response.status === 401) {
                mainContent.innerHTML = `
                    <div class="alert alert-warning text-center" role="alert">
                        <h4 class="alert-heading">未登录</h4>
                        <p>请先登录后再查看借阅记录</p>
                        <hr>
                        <button class="btn btn-primary" onclick="showLoginModal()">登录</button>
                        <button class="btn btn-outline-primary" onclick="showRegisterModal()">注册</button>
                    </div>
                `;
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const borrowings = await response.json();
            
            let html = `
                <div class="container">
                    <h2 class="mb-4">我的借阅</h2>
                    <div class="row">
                        <div class="col-md-3 mb-4">
                            <div class="card text-white bg-primary">
                                <div class="card-body">
                                    <h5 class="card-title">当前借阅</h5>
                                    <p class="card-text h2">${borrowings.filter(b => b.status === 'borrowed').length}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-4">
                            <div class="card text-white bg-success">
                                <div class="card-body">
                                    <h5 class="card-title">已归还</h5>
                                    <p class="card-text h2">${borrowings.filter(b => b.status === 'returned').length}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-4">
                            <div class="card text-white bg-warning">
                                <div class="card-body">
                                    <h5 class="card-title">即将到期</h5>
                                    <p class="card-text h2">${borrowings.filter(b => {
                                        if (b.status !== 'borrowed') return false;
                                        const dueDate = new Date(b.due_date);
                                        const now = new Date();
                                        const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                                        return daysLeft <= 3 && daysLeft > 0;
                                    }).length}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-4">
                            <div class="card text-white bg-danger">
                                <div class="card-body">
                                    <h5 class="card-title">已逾期</h5>
                                    <p class="card-text h2">${borrowings.filter(b => b.status === 'overdue').length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <ul class="nav nav-tabs card-header-tabs">
                                <li class="nav-item">
                                    <a class="nav-link active" data-status="all">全部</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-status="borrowed">借阅中</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-status="returned">已归还</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-status="overdue">已逾期</a>
                                </li>
                            </ul>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>图</th>
                                            <th>借阅日期</th>
                                            <th>应还日期</th>
                                            <th>实际归还日期</th>
                                            <th>状态</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
            `;
            
            borrowings.forEach(borrowing => {
                const dueDate = new Date(borrowing.due_date);
                const now = new Date();
                const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                let statusText = '';
                let statusClass = '';
                
                switch (borrowing.status) {
                    case 'borrowed':
                        statusText = daysLeft <= 3 ? `还剩 ${daysLeft} 天` : '借阅中';
                        statusClass = daysLeft <= 3 ? 'warning' : 'primary';
                        break;
                    case 'returned':
                        statusText = '已归还';
                        statusClass = 'success';
                        break;
                    case 'overdue':
                        statusText = '已逾期';
                        statusClass = 'danger';
                        break;
                }

                html += `
                    <tr data-status="${borrowing.status}">
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="${borrowing.cover_url || 'https://pic3.zhimg.com/v2-5fb13110e1de13d4c11e6e7f5b8026da_r.jpg'}" 
                                     alt="${borrowing.title}" 
                                     style="width: 50px; height: 70px; object-fit: cover; margin-right: 10px;">
                                <div>
                                    <h6 class="mb-0">${borrowing.title}</h6>
                                    <small class="text-muted">${borrowing.author}</small>
                                </div>
                            </div>
                        </td>
                        <td>${new Date(borrowing.borrow_date).toLocaleDateString()}</td>
                        <td>${new Date(borrowing.due_date).toLocaleDateString()}</td>
                        <td>${borrowing.return_date ? new Date(borrowing.return_date).toLocaleDateString() : '-'}</td>
                        <td><span class="badge bg-${statusClass}">${statusText}</span></td>
                        <td>
                            ${borrowing.status === 'borrowed' ? `
                                <button class="btn btn-sm btn-primary" onclick="returnBook(${borrowing.id})">还书</button>
                                <button class="btn btn-sm btn-outline-primary" onclick="renewBook(${borrowing.id})">续借</button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            });
            
            html += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = html;

            // 添加标签页切换功能
            document.querySelectorAll('.nav-link').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    // 更新标签页状态
                    document.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    // 过滤借阅记录
                    const status = tab.dataset.status;
                    document.querySelectorAll('tbody tr').forEach(tr => {
                        if (status === 'all' || tr.dataset.status === status) {
                            tr.style.display = '';
                        } else {
                            tr.style.display = 'none';
                        }
                    });
                });
            });

        } catch (error) {
            console.error('加载借阅记录失败:', error);
            mainContent.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    加载借阅记录失败: ${error.message}
                    <button class="btn btn-link" onclick="showBorrowings()">重试</button>
                </div>
            `;
        }
    }
    // 显示收藏夹
    async function showFavorites() {
        mainContent.innerHTML = '<div class="loading">加载中...</div>';
        try {
            const response = await fetch('/api/favorites', {
                credentials: 'include'
            });

            if (response.status === 401) {
                mainContent.innerHTML = `
                    <div class="alert alert-warning text-center" role="alert">
                        <h4 class="alert-heading">未登录</h4>
                        <p>请先登录后再查看收藏夹</p>
                        <hr>
                        <button class="btn btn-primary" onclick="showLoginModal()">登录</button>
                        <button class="btn btn-outline-primary" onclick="showRegisterModal()">注册</button>
                    </div>
                `;
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const favorites = await response.json();
            
            let html = `
                <div class="container">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>我的收藏</h2>
                        <button class="btn btn-primary" onclick="showCreateFavoriteModal()">
                            <i class="fas fa-plus"></i> 创建收藏夹
                        </button>
                    </div>
                    ${favorites.length === 0 ? '<p class="text-center">暂无收藏夹</p>' : ''}
                    <div class="row">
            `;
            
            favorites.forEach(favorite => {
                html += `
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <h5 class="card-title">${favorite.name}</h5>
                                <p class="card-text">${favorite.description || '暂无描述'}</p>
                                <p class="card-text">
                                    <small class="text-muted">创建于 ${new Date(favorite.created_at).toLocaleDateString()}</small>
                                </p>
                            </div>
                            <div class="card-footer">
                                <button class="btn btn-primary btn-sm" onclick="viewFavorite(${favorite.id})">查看详情</button>
                                <button class="btn btn-outline-danger btn-sm" onclick="deleteFavorite(${favorite.id})">删除</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = html;
        } catch (error) {
            console.error('加载收藏夹失败:', error);
            mainContent.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    加载收藏夹失败: ${error.message}
                    <button class="btn btn-link" onclick="showFavorites()">重试</button>
                </div>
            `;
        }
    }

    // 工具函数
    function getStatusText(status) {
        const statusMap = {
            'borrowed': '借阅中',
            'returned': '已归还',
            'overdue': '已逾期'
        };
        return statusMap[status] || status;
    }

    function isAdmin() {
        const userInfo = document.getElementById('username');
        return userInfo && userInfo.dataset.role === 'admin';
    }

    // 搜索功能实现
    async function handleSearch(event) {
        const query = event.target.value.trim();
        const booksListDiv = document.getElementById('booksList');
        
        if (!query) {
            // 如果搜索框为空，显示所有图书
            showBooks();
            return;
        }

        try {
            const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`, {
                credentials: 'include'
            });
            
            if (response.status === 401) {
                booksListDiv.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-warning text-center" role="alert">
                            <h4 class="alert-heading">未登录</h4>
                            <p>请先登录后再搜索图书</p>
                            <hr>
                            <button class="btn btn-primary" onclick="showLoginModal()">登录</button>
                            <button class="btn btn-outline-primary" onclick="showRegisterModal()">注册</button>
                        </div>
                    </div>
                `;
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const books = await response.json();
            
            let html = '';
            if (books.length === 0) {
                html = '<div class="col-12"><p class="text-center">未找到相关图书</p></div>';
            } else {
                books.forEach(book => {
                    html += `
                        <div class="col-md-6 col-lg-4 mb-4">
                            <div class="card h-100">
                                <img src="${book.cover_url || 'https://via.placeholder.com/150'}" 
                                     class="card-img-top" alt="${book.title}"
                                     style="height: 200px; object-fit: cover;">
                                <div class="card-body">
                                    <h5 class="card-title">${book.title}</h5>
                                    <p class="card-text">作者：${book.author}</p>
                                    <p class="card-text">ISBN：${book.isbn || '暂无'}</p>
                                    <p class="card-text">库存：${book.stock || 0}</p>
                                </div>
                                <div class="card-footer">
                                    <button class="btn btn-primary btn-sm" onclick="borrowBook(${book.id})">借阅</button>
                                    <button class="btn btn-info btn-sm" onclick="showBookDetails(${book.id})">详情</button>
                                    ${isAdmin() ? `
                                        <button class="btn btn-warning btn-sm" onclick="editBook(${book.id})">编辑</button>
                                        <button class="btn btn-danger btn-sm" onclick="deleteBook(${book.id})">删除</button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            
            booksListDiv.innerHTML = html;
        } catch (error) {
            console.error('搜索失败:', error);
            booksListDiv.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        搜索失败: ${error.message}
                    </div>
                </div>
            `;
        }
    }

    // 防抖函数实现
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 初始化：检查登录状态并显示首页
    checkAuth().then(() => {
        routes.home();
    });

    // 将路由对象暴露给全局
    window.routes = routes;

    // 显示注册模态框
    window.showRegisterModal = function() {
        const modal = new bootstrap.Modal(document.getElementById('registerModal'));
        modal.show();
    }

    // 注册功能
    window.register = async function() {
        const form = document.getElementById('registerForm');
        const username = form.querySelector('input[name="username"]').value;
        const email = form.querySelector('input[name="email"]').value;
        const password = form.querySelector('input[name="password"]').value;
        const confirmPassword = form.querySelector('input[name="confirmPassword"]').value;

        // 表单验证
        if (!username || !email || !password || !confirmPassword) {
            alert('请填写所有必填字段');
            return;
        }

        if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('注册成功！请登录');
                const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                registerModal.hide();
                showLoginModal();
            } else {
                alert(data.message || '注册失败，请重试');
            }
        } catch (error) {
            console.error('注册失败:', error);
            alert('注册失败，请重试');
        }
    }

    // 显示登录模态框
    window.showLoginModal = function() {
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    }

    // 登录功能
    window.login = async function() {
        const form = document.getElementById('loginForm');
        const username = form.querySelector('input[name="username"]').value;
        const password = form.querySelector('input[name="password"]').value;

        if (!username || !password) {
            alert('请填写用户名和密码');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                loginModal.hide();
                checkAuth();
                routes.home();
            } else {
                alert(data.message || '登录失败，请重试');
            }
        } catch (error) {
            console.error('登录失败:', error);
            alert('登录失败，请重试');
        }
    }

    // 退出登录
    window.logout = async function() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                showAuthButtons();
                routes.home();
            } else {
                alert('退出登录失败，请重试');
            }
        } catch (error) {
            console.error('退出登录失败:', error);
            alert('退出登录失败，请重试');
        }
    }

    // 显示我的借阅
    window.showMyBorrowings = function() {
        routes.borrowings();
    }

    // 显示我的评论
    window.showMyReviews = async function() {
        mainContent.innerHTML = '<div class="loading">加载中...</div>';
        try {
            const response = await fetch('/api/reviews/user/me', {
                credentials: 'include'
            });
            const reviews = await response.json();
            
            let html = `
                <div class="container">
                    <h2 class="mb-4">的评论</h2>
                    ${reviews.length === 0 ? '<p class="text-center">暂无评论</p>' : ''}
                    <div class="review-list">
            `;
            
            reviews.forEach(review => {
                html += `
                    <div class="review-item">
                        <h5>${review.book_title}</h5>
                        <div class="rating">评分：${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</div>
                        <p>${review.content}</p>
                        <small class="text-muted">评论时间：${new Date(review.created_at).toLocaleString()}</small>
                        <div class="review-actions mt-2">
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteReview(${review.id})">删除评论</button>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = html;
        } catch (error) {
            mainContent.innerHTML = '<div class="error-message">加载评论失败</div>';
        }
    }

    // 显示修改密码模态框
    window.showChangePasswordModal = function() {
        const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
        modal.show();
    }

    // 修改密码
    window.changePassword = async function() {
        const form = document.getElementById('changePasswordForm');
        const currentPassword = form.querySelector('input[name="currentPassword"]').value;
        const newPassword = form.querySelector('input[name="newPassword"]').value;
        const confirmNewPassword = form.querySelector('input[name="confirmNewPassword"]').value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            alert('请填写所有密码字段');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert('两次输入的新密码不一致');
            return;
        }

        try {
            const response = await fetch('/api/auth/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('密码修改成功！');
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                modal.hide();
                form.reset();
            } else {
                alert(data.message || '密码修改失败，请重试');
            }
        } catch (error) {
            console.error('密码修改失败:', error);
            alert('密码修改失败，请重试');
        }
    }

    // 创建收藏夹
    window.showCreateFavoriteModal = function() {
        const modal = new bootstrap.Modal(document.getElementById('createFavoriteModal'));
        modal.show();
    }

    // 创建收藏夹
    window.createFavorite = async function() {
        const form = document.getElementById('createFavoriteForm');
        const name = form.querySelector('input[name="name"]').value.trim();
        const description = form.querySelector('textarea[name="description"]').value.trim();

        if (!name) {
            alert('请输入收藏夹名称');
            return;
        }

        try {
            const response = await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ name, description })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '创建收藏夹失败');
            }

            const favorite = await response.json();
            
            // 添加图书到新创建的收藏夹
            await addToFavorite(favorite.id);
            
            // 隐藏创建表单
            hideCreateFavoriteForm();
            
            // 重新加载收藏夹列表
            await loadFavorites();
        } catch (error) {
            console.error('创建收藏夹失败:', error);
            alert(error.message || '创建收藏夹失败，请重试');
        }
    }

    // 添加图书到收藏夹
    window.addToFavorite = async function(favoriteId) {
        try {
            const response = await fetch(`/api/favorites/${favoriteId}/books`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    book_id: currentBookId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '添加到收藏夹失败');
            }

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('favoriteModal'));
            modal.hide();
            
            alert('添加到收藏夹成功！');
        } catch (error) {
            console.error('添加到收藏夹失败:', error);
            alert(error.message || '添加到收藏夹失败，请重试');
        }
    }
    // 获取借阅状态对应的样式类
    function getBadgeClass(status) {
        const statusMap = {
            'borrowed': 'bg-primary',
            'returned': 'bg-success',
            'overdue': 'bg-danger'
        };
        return statusMap[status] || 'bg-secondary';
    }

    // 生成随机ISBN
    window.generateISBN = function() {
        // 生成13位随机数字
        let isbn = '978'; // ISBN-13 前缀
        for (let i = 0; i < 10; i++) {
            isbn += Math.floor(Math.random() * 10);
        }
        
        // 设置到输入框
        const isbnInput = document.querySelector('#addBookForm input[name="isbn"]');
        isbnInput.value = isbn;
    }

    // 显示添加图书模态框
    window.showAddBookModal = async function() {
        const modal = new bootstrap.Modal(document.getElementById('addBookModal'));
        const form = document.getElementById('addBookForm');
        
        // 设置默认封面URL
        form.querySelector('input[name="cover_url"]').value = 'https://pic3.zhimg.com/v2-5fb13110e1de13d4c11e6e7f5b8026da_r.jpg';
        
        // 生成随机ISBN
        generateISBN();
        
        // 加载分类选项
        try {
            const response = await fetch('/api/categories', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const categories = await response.json();
                const select = form.querySelector('select[name="category_id"]');
                select.innerHTML = '<option value="">请选择分类</option>';
                categories.forEach(category => {
                    select.innerHTML += `<option value="${category.id}">${category.name}</option>`;
                });
            }
        } catch (error) {
            console.error('加载分类失败:', error);
        }

        modal.show();
    }

    // 添加图书
    window.addBook = async function() {
        const form = document.getElementById('addBookForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // 如果没有填写封面URL，使用默认值
        if (!data.cover_url) {
            data.cover_url = 'https://pic3.zhimg.com/v2-5fb13110e1de13d4c11e6e7f5b8026da_r.jpg';
        }

        // 表单验证
        if (!validateBookForm(data)) {
            return;
        }

        try {
            const response = await fetch('/api/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                alert('图书添加成功！');
                const modal = bootstrap.Modal.getInstance(document.getElementById('addBookModal'));
                modal.hide();
                form.reset();
                showBooks(); // 刷新图书列表
            } else {
                alert(result.message || '添加图书失败，请重试');
            }
        } catch (error) {
            console.error('添加图书失败:', error);
            alert('添加图书失败，请重试');
        }
    }

    // 图书表单验证
    function validateBookForm(data) {
        if (!data.title || !data.author || !data.isbn || !data.stock) {
            alert('请填写必填字段（书名、作者、ISBN、库存）');
            return false;
        }

        if (!/^[0-9]{13}$/.test(data.isbn)) {
            alert('ISBN必须是13位字');
            return false;
        }

        if (data.stock < 0) {
            alert('库存不能为负数');
            return false;
        }

        if (data.price && data.price < 0) {
            alert('价格不能为负数');
            return false;
        }

        if (data.cover_url && !isValidUrl(data.cover_url)) {
            alert('请输入有效的封面URL');
            return false;
        }

        return true;
    }

    // URL验证
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // 当前选中的图书ID
    let currentBookId = null;

    // 显示图书详情
    window.showBookDetails = async function(bookId) {
        try {
            const response = await fetch(`/api/books/${bookId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const book = await response.json();
            currentBookId = book.id;
            
            // 填充详情模态框
            document.getElementById('bookDetailCover').src = book.cover_url || 'https://pic3.zhimg.com/v2-5fb13110e1de13d4c11e6e7f5b8026da_r.jpg';
            document.getElementById('bookDetailTitle').textContent = book.title;
            document.getElementById('bookDetailAuthor').textContent = `作者：${book.author}`;
            document.getElementById('bookDetailIsbn').textContent = book.isbn;
            document.getElementById('bookDetailCategory').textContent = book.category_name || '未分类';
            document.getElementById('bookDetailPublisher').textContent = book.publisher || '未知';
            document.getElementById('bookDetailPublishDate').textContent = book.publish_date || '未知';
            document.getElementById('bookDetailPrice').textContent = book.price ? `￥${book.price}` : '未知';
            document.getElementById('bookDetailStock').textContent = book.stock || 0;
            document.getElementById('bookDetailDescription').textContent = book.description || '暂无描述';

            // 根据库存状态设置借阅按钮
            const borrowButton = document.querySelector('#bookDetailsModal .btn-primary');
            if (book.stock > 0) {
                borrowButton.disabled = false;
                borrowButton.textContent = '借阅';
            } else {
                borrowButton.disabled = true;
                borrowButton.textContent = '暂无库存';
            }
            
            // 显示模态框
            const modal = new bootstrap.Modal(document.getElementById('bookDetailsModal'));
            modal.show();
        } catch (error) {
            console.error('获取图书详情失败:', error);
            alert('获取图书详情失败，请重试');
        }
    }

    // 编辑图书
    window.editBook = async function(bookId) {
        try {
            const response = await fetch(`/api/books/${bookId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const book = await response.json();
            currentBookId = book.id;
            
            // 填充编辑表单
            const form = document.getElementById('editBookForm');
            form.querySelector('input[name="id"]').value = book.id;
            form.querySelector('input[name="title"]').value = book.title;
            form.querySelector('input[name="author"]').value = book.author;
            form.querySelector('input[name="isbn"]').value = book.isbn;
            form.querySelector('input[name="publisher"]').value = book.publisher || '';
            form.querySelector('input[name="publish_date"]').value = book.publish_date || '';
            form.querySelector('input[name="price"]').value = book.price || '';
            form.querySelector('input[name="stock"]').value = book.stock || 0;
            form.querySelector('input[name="cover_url"]').value = book.cover_url || '';
            form.querySelector('textarea[name="description"]').value = book.description || '';

            // 加载分类选项
            const categoriesResponse = await fetch('/api/categories', {
                credentials: 'include'
            });
            
            if (categoriesResponse.ok) {
                const categories = await categoriesResponse.json();
                const select = form.querySelector('select[name="category_id"]');
                select.innerHTML = '<option value="">请选择分类</option>';
                categories.forEach(category => {
                    select.innerHTML += `<option value="${category.id}" ${category.id === book.category_id ? 'selected' : ''}>${category.name}</option>`;
                });
            }
            
            // 显示模态框
            const modal = new bootstrap.Modal(document.getElementById('editBookModal'));
            modal.show();
        } catch (error) {
            console.error('获取图书详情失败:', error);
            alert('获取图书详情失败，请重试');
        }
    }

    // 更新图书
    window.updateBook = async function() {
        const form = document.getElementById('editBookForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // 表单验证
        if (!validateBookForm(data)) {
            return;
        }

        try {
            const response = await fetch(`/api/books/${currentBookId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                alert('图书更新成功！');
                const modal = bootstrap.Modal.getInstance(document.getElementById('editBookModal'));
                modal.hide();
                showBooks(); // 刷新图书列表
            } else {
                alert(result.message || '更新图书失败，请重试');
            }
        } catch (error) {
            console.error('更新图书失败:', error);
            alert('更新图书失败，请重试');
        }
    }

    // 删除图书
    window.deleteBook = async function(bookId) {
        if (!confirm('确定要删除这本图书吗？删除后无法恢复。')) {
            return;
        }

        try {
            const response = await fetch(`/api/books/${bookId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                alert('图书删除成功！');
                showBooks(); // 刷新图书列表
            } else {
                const result = await response.json();
                alert(result.message || '删除图书失败，请重试');
            }
        } catch (error) {
            console.error('删除图书失败:', error);
            alert('删除图书失败，请重试');
        }
    }

    // 借阅图书
    window.borrowBook = async function(bookId) {
        try {
            // 检查登录状态
            const authResponse = await fetch('/api/auth/me', {
                credentials: 'include'
            });

            if (!authResponse.ok) {
                alert('请先登录后再进行借阅');
                showLoginModal();
                return;
            }

            // 获取图书信息
            const bookResponse = await fetch(`/api/books/${bookId}`, {
                credentials: 'include'
            });
            
            if (!bookResponse.ok) {
                throw new Error('获取图书信息失败');
            }

            const book = await bookResponse.json();
            
            if (!book) {
                alert('图书不存在');
                return;
            }

            if (book.stock <= 0) {
                alert('抱歉，该图书已无库存');
                return;
            }

            // 检查是否已借阅该图书
            const borrowingsResponse = await fetch('/api/borrowings/my', {
                credentials: 'include'
            });

            if (borrowingsResponse.ok) {
                const borrowings = await borrowingsResponse.json();
                const hasBorrowed = borrowings.some(b => 
                    b.book_id === bookId && b.status === 'borrowed'
                );

                if (hasBorrowed) {
                    alert('您已借阅过这本书，请先归还后再借阅');
                    return;
                }
            }

            // 显示借阅确认模态框
            document.getElementById('borrowBookTitle').textContent = book.title;
            currentBookId = bookId;

            // 重置借阅表单
            const form = document.getElementById('borrowForm');
            form.reset();
            document.getElementById('borrowDuration').value = '30';
            updateReturnDate();
            
            // 添加借阅时长选择事件
            document.getElementById('borrowDuration').addEventListener('change', handleDurationChange);
            document.getElementById('customDurationDiv').querySelector('input').addEventListener('input', updateReturnDate);
            
            const modal = new bootstrap.Modal(document.getElementById('borrowBookModal'));
            modal.show();
        } catch (error) {
            console.error('借阅操作失败:', error);
            alert('借阅操作失败，请重试');
        }
    }

    // 处理借阅时长选择变化
    function handleDurationChange(event) {
        const customDurationDiv = document.getElementById('customDurationDiv');
        if (event.target.value === 'custom') {
            customDurationDiv.classList.remove('d-none');
        } else {
            customDurationDiv.classList.add('d-none');
        }
        updateReturnDate();
    }

    // 更新预计归还日期
    function updateReturnDate() {
        const durationSelect = document.getElementById('borrowDuration');
        const customDurationInput = document.getElementById('customDurationDiv').querySelector('input');
        const returnDateInput = document.getElementById('returnDate');

        let days;
        if (durationSelect.value === 'custom') {
            days = parseInt(customDurationInput.value) || 30;
            // 限制天数范围
            if (days < 1) days = 1;
            if (days > 180) days = 180;
            customDurationInput.value = days;
        } else {
            days = parseInt(durationSelect.value);
        }

        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + days);
        returnDateInput.value = returnDate.toLocaleDateString();
    }

    // 确认借阅
    window.confirmBorrow = async function() {
        try {
            // 获取借阅时长
            const durationSelect = document.getElementById('borrowDuration');
            const customDurationInput = document.getElementById('customDurationDiv').querySelector('input');
            let days = parseInt(durationSelect.value === 'custom' ? customDurationInput.value : durationSelect.value);

            // 验证借阅时长
            if (isNaN(days) || days < 1 || days > 180) {
                throw new Error('借阅时长必须在1-180天之间');
            }

            // 检查图书状态和库存
            const bookResponse = await fetch(`/api/books/${currentBookId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!bookResponse.ok) {
                throw new Error('获取图书信息失败');
            }

            const book = await bookResponse.json();
            if (!book) {
                throw new Error('图书不存在');
            }

            if (!book.stock || book.stock <= 0) {
                throw new Error('图书库存不足');
            }

            // 设置借阅日期
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + days);

            // 发送借阅请求
            const borrowResponse = await fetch('/api/borrowings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    book_id: currentBookId,
                    due_date: dueDate.toISOString()
                })
            });

            // 检查借阅响应
            if (!borrowResponse.ok) {
                const errorData = await borrowResponse.json();
                if (errorData.message) {
                    throw new Error(errorData.message);
                }
                throw new Error('借阅失败，请重试');
            }

            // 再次检查库存是否已被更新
            const finalCheckResponse = await fetch(`/api/books/${currentBookId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (finalCheckResponse.ok) {
                const updatedBook = await finalCheckResponse.json();
                if (!updatedBook || updatedBook.stock <= 0) {
                    throw new Error('抱歉，该图书已被其他用户借出');
                }
            }

            // 借阅成功处理
            const result = await borrowResponse.json();

            // 关闭借阅模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('borrowBookModal'));
            modal.hide();

            // 显示成功提示
            alert(`借阅成功！请在 ${dueDate.toLocaleDateString()} 前归还图书。`);
            
            // 刷新图书列表和跳转到借阅记录
            await showBooks();
            showBorrowings();

        } catch (error) {
            console.error('借阅失败:', error);
            alert(error.message || '借阅失败，请重试');
            
            // 关闭借阅模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('borrowBookModal'));
            modal.hide();
            
            // 刷新图书列表以更新库存状态
            showBooks();
        }
    }

    // 从详情页借阅
    window.borrowCurrentBook = function() {
        const title = document.getElementById('bookDetailTitle').textContent;
        document.getElementById('borrowBookTitle').textContent = title;
        
        const detailsModal = bootstrap.Modal.getInstance(document.getElementById('bookDetailsModal'));
        detailsModal.hide();
        
        const borrowModal = new bootstrap.Modal(document.getElementById('borrowBookModal'));
        borrowModal.show();
    }

    // 显示评论模态框
    window.showComments = async function(bookId) {
        try {
            // 获取图书信息
            const bookResponse = await fetch(`/api/books/${bookId}`, {
                credentials: 'include'
            });
            
            if (!bookResponse.ok) {
                throw new Error('获取图书信息失败');
            }

            const book = await bookResponse.json();
            currentBookId = bookId;
            
            // 设置图书标题
            document.getElementById('commentBookTitle').textContent = book.title;
            
            // 重置评论表单
            document.getElementById('commentForm').reset();
            
            // 加载评论列表
            await loadComments(bookId);
            
            // 显示模态框
            const modal = new bootstrap.Modal(document.getElementById('commentModal'));
            modal.show();
        } catch (error) {
            console.error('加载评论失败:', error);
            alert('加载评论失败，请重试');
        }
    }

    // 加载评论列表
    async function loadComments(bookId) {
        try {
            const response = await fetch(`/api/reviews/book/${bookId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('获取评论失败');
            }

            const comments = await response.json();
            const commentsList = document.getElementById('commentsList');
            
            if (comments.length === 0) {
                commentsList.innerHTML = '<p class="text-center text-muted">暂无评论</p>';
                return;
            }

            let html = '';
            comments.forEach(comment => {
                html += `
                    <div class="comment-item">
                        <div class="comment-header">
                            <div>
                                <strong>${comment.username}</strong>
                                <span class="comment-rating">
                                    ${'★'.repeat(comment.rating)}${'☆'.repeat(5-comment.rating)}
                                </span>
                            </div>
                            <small class="text-muted">
                                ${new Date(comment.created_at).toLocaleString()}
                            </small>
                        </div>
                        <div class="comment-content">${comment.content}</div>
                    </div>
                `;
            });
            
            commentsList.innerHTML = html;
        } catch (error) {
            console.error('加载评论失败:', error);
            document.getElementById('commentsList').innerHTML = 
                '<div class="alert alert-danger">加载评论失败，请重试</div>';
        }
    }

    // 提交评论
    window.submitComment = async function() {
        try {
            const form = document.getElementById('commentForm');
            const rating = form.querySelector('input[name="rating"]:checked');
            const content = form.querySelector('textarea[name="content"]').value;

            if (!rating) {
                alert('请选择评分');
                return;
            }

            if (!content.trim()) {
                alert('请输入评论内容');
                return;
            }

            const response = await fetch(`/api/reviews/book/${currentBookId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    rating: parseInt(rating.value),
                    content: content.trim()
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '发表评论失败');
            }

            // 重新加载评论列表
            await loadComments(currentBookId);
            
            // 重置表单
            form.reset();
            
            alert('评论发表成功！');
        } catch (error) {
            console.error('发表评论失败:', error);
            alert(error.message || '发表评论失败，请重试');
        }
    }

    // 显示收藏模态框
    window.showFavoriteModal = async function(bookId) {
        try {
            // 获取图书信息
            const bookResponse = await fetch(`/api/books/${bookId}`, {
                credentials: 'include'
            });
            
            if (!bookResponse.ok) {
                throw new Error('获取图书信息失败');
            }

            const book = await bookResponse.json();
            currentBookId = bookId;
            
            // 设置图书标题
            document.getElementById('favoriteBookTitle').textContent = book.title;
            
            // 加载收藏夹列表
            await loadFavorites();
            
            // 显示模态框
            const modal = new bootstrap.Modal(document.getElementById('favoriteModal'));
            modal.show();
        } catch (error) {
            console.error('加载收藏夹失败:', error);
            alert('加载收藏夹失败，请重试');
        }
    }

    // 加载收藏夹列表
    async function loadFavorites() {
        try {
            const response = await fetch('/api/favorites', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('获取收藏夹失败');
            }

            const favorites = await response.json();
            const favoritesList = document.getElementById('favoritesList');
            
            if (favorites.length === 0) {
                favoritesList.innerHTML = '<p class="text-center text-muted">暂无收藏夹</p>';
                return;
            }

            let html = '';
            favorites.forEach(favorite => {
                html += `
                    <button class="list-group-item list-group-item-action favorite-item" 
                            onclick="addToFavorite(${favorite.id})">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">${favorite.name}</h6>
                                <small class="text-muted">${favorite.description || '暂无描述'}</small>
                            </div>
                            <span class="badge bg-primary rounded-pill">
                                ${favorite.book_count || 0}本
                            </span>
                        </div>
                    </button>
                `;
            });
            
            favoritesList.innerHTML = html;
        } catch (error) {
            console.error('加载收藏夹失败:', error);
            document.getElementById('favoritesList').innerHTML = 
                '<div class="alert alert-danger">加载收藏夹失败，请重试</div>';
        }
    }

    // 显示创建收藏夹表单
    window.showCreateFavoriteForm = function() {
        document.getElementById('createFavoriteForm').classList.remove('d-none');
    }

    // 隐藏创建收藏夹表单
    window.hideCreateFavoriteForm = function() {
        const form = document.getElementById('createFavoriteForm');
        form.classList.add('d-none');
        form.reset();
    }

    // 创建收藏夹并添加图书
    window.createFavorite = async function() {
        try {
            const form = document.getElementById('createFavoriteForm');
            const name = form.querySelector('input[name="name"]').value.trim();
            const description = form.querySelector('textarea[name="description"]').value.trim();

            if (!name) {
                alert('请输入收藏夹名称');
                return;
            }

            // 创建收藏夹
            const response = await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ name, description })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '创建收藏夹失败');
            }

            const favorite = await response.json();
            
            // 添加图书到新创建的收藏夹
            await addToFavorite(favorite.id);
            
            // 隐藏创建表单
            hideCreateFavoriteForm();
            
            // 重新加载收藏夹列表
            await loadFavorites();
        } catch (error) {
            console.error('创建收藏夹失败:', error);
            alert(error.message || '创建收藏夹失败，请重试');
        }
    }

    // 添加图书到收藏夹
    window.addToFavorite = async function(favoriteId) {
        try {
            const response = await fetch(`/api/favorites/${favoriteId}/books`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    book_id: currentBookId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '添加到收藏夹失败');
            }

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('favoriteModal'));
            modal.hide();
            
            alert('添加到收藏夹成功！');
        } catch (error) {
            console.error('添加到收藏夹失败:', error);
            alert(error.message || '添加到收藏夹失败，请重试');
        }
    }
}); 
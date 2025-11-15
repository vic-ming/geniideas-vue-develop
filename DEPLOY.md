# Vercel 部署指南

## 快速部署

是的，您可以直接将整个项目推送到 Vercel！

### 方法 1: 通过 Vercel Dashboard（推荐）

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub/GitLab/Bitbucket 账号登录

2. **导入项目**
   - 点击 "Add New Project"
   - 选择您的 Git 仓库
   - Vercel 会自动检测配置

3. **配置项目**
   - Framework Preset: 选择 "Other" 或 "Vite"
   - Build Command: `npm run build`（已自动检测）
   - Output Directory: `dist`（已自动检测）
   - Install Command: `npm install`

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成

### 方法 2: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在项目根目录执行
vercel

# 按照提示完成部署
```

## 项目结构

项目已配置为：
- ✅ 前端：Vue.js + Vite，构建到 `dist/` 目录
- ✅ 后端 API：Serverless Functions 在 `api/` 目录
- ✅ 数据库：SQLite（在 Vercel 上使用 `/tmp` 目录）

## 重要说明

### ⚠️ 数据库持久化

**重要**: SQLite 数据库存储在 `/tmp` 目录，这意味着：
- 数据在每次函数调用之间可能不持久
- 每次重新部署后数据会重置
- 适合开发/测试，不适合生产环境

**生产环境建议**:
- 使用 Vercel Postgres
- 或使用外部数据库服务（如 Supabase、PlanetScale）

### API 路由

所有 API 端点都在 `/api/flowcharts` 下：
- `GET /api/flowcharts` - 获取所有文件
- `GET /api/flowcharts/search?q=关键词` - 搜索
- `GET /api/flowcharts/:id` - 获取单个文件
- `POST /api/flowcharts` - 创建新文件
- `PUT /api/flowcharts/:id` - 更新文件
- `DELETE /api/flowcharts/:id` - 删除文件

### 测试部署

部署后，可以访问：
- `https://your-project.vercel.app/api/test` - 测试数据库连接

## 故障排除

### 如果遇到 "无法连接到服务器" 错误

1. **检查 Vercel 函数日志**
   - 在 Vercel Dashboard 中查看 Functions 标签
   - 检查是否有错误信息

2. **验证 API 路由**
   - 访问 `https://your-project.vercel.app/api/test`
   - 应该返回数据库连接状态

3. **检查环境变量**
   - 确保没有需要设置的环境变量

4. **查看构建日志**
   - 在 Vercel Dashboard 的 Deployments 中查看构建日志
   - 确认 `better-sqlite3` 正确安装

### 常见问题

**Q: better-sqlite3 安装失败？**
A: Vercel 支持原生模块，但需要确保使用 Node.js 18.x（已在 vercel.json 中配置）

**Q: API 返回 404？**
A: 检查 `api/` 目录下的文件是否正确，确保使用正确的路由路径

**Q: 数据库数据丢失？**
A: 这是正常的，因为使用 `/tmp` 目录。考虑迁移到持久化数据库。

## 下一步

部署成功后：
1. 测试所有 API 端点
2. 测试前端功能
3. 考虑迁移到持久化数据库（如需要）


# Vercel 部署说明

## 概述

本项目已配置为可以在 Vercel 上部署，包括前端 Vue.js 应用和后端 SQLite 数据库 API。

## 重要说明

### 数据库存储

⚠️ **重要**: 在 Vercel 上，SQLite 数据库存储在 `/tmp` 目录中。这意味着：

1. **数据不是持久化的**: `/tmp` 目录在每次函数调用时可能会被清空
2. **每次部署后数据会丢失**: 当重新部署时，数据库会被重置
3. **建议**: 对于生产环境，建议使用 Vercel Postgres 或其他云数据库服务

### 当前配置

- 数据库文件位置：
  - 本地开发: `server/db/flowcharts.db`
  - Vercel 生产环境: `/tmp/flowcharts.db`

## 部署步骤

1. **安装依赖**:
   ```bash
   npm install
   ```

2. **构建项目**:
   ```bash
   npm run build
   ```

3. **部署到 Vercel**:
   - 通过 Vercel CLI: `vercel`
   - 或通过 Vercel Dashboard 连接 GitHub 仓库

## API 路由

所有 API 路由都在 `/api/flowcharts` 下：

- `GET /api/flowcharts` - 获取所有流程图
- `GET /api/flowcharts/search?q=关键词` - 搜索流程图
- `GET /api/flowcharts/:id` - 获取单个流程图
- `POST /api/flowcharts` - 创建新流程图
- `PUT /api/flowcharts/:id` - 更新流程图
- `DELETE /api/flowcharts/:id` - 删除流程图

## 文件结构

```
.
├── api/                    # Vercel Serverless Functions
│   ├── flowcharts.js       # 主 API 路由（GET, POST）
│   └── flowcharts/
│       └── [id].js         # 动态路由（GET, PUT, DELETE）
├── server/                  # 服务器代码
│   └── db/
│       └── database.js     # 数据库配置（支持 Vercel）
├── src/                     # 前端代码
│   └── utils/
│       └── api.js          # API 客户端
└── vercel.json             # Vercel 配置
```

## 环境变量

当前不需要额外的环境变量。数据库会自动检测是否在 Vercel 环境中运行。

## 升级到持久化数据库

如果需要持久化存储，建议：

1. **使用 Vercel Postgres**:
   - 在 Vercel Dashboard 中添加 Postgres 数据库
   - 修改 `server/db/database.js` 使用 Postgres 客户端

2. **使用外部数据库服务**:
   - 如 Supabase, PlanetScale, 或其他云数据库
   - 更新 `server/db/database.js` 使用相应的客户端

## 本地开发

本地开发时，前端会通过 Vite 代理访问后端：

- 前端: `http://localhost:3000`
- 后端 API: `http://localhost:3001` (通过 Vite 代理)

运行本地开发服务器：

```bash
# 终端 1: 启动后端服务器
cd server
npm install
npm run dev

# 终端 2: 启动前端开发服务器
npm run dev
```


// Vercel Postgres 数据库工具
// 使用此文件替代 db-utils.js 以支持持久化存储
import { createClient } from '@vercel/postgres';

// 创建数据库客户端（单例模式）
let client = null;

function getClient() {
  if (client) {
    return client;
  }

  // 检查环境变量
  const postgresUrl = process.env.POSTGRES_URL || 
                      process.env.POSTGRES_PRISMA_URL || 
                      process.env.POSTGRES_URL_NON_POOLING ||
                      process.env.STORAGE_URL ||  // 如果使用 STORAGE 前缀
                      process.env.DATABASE_URL;   // 通用数据库 URL
  
  if (!postgresUrl) {
    throw new Error(
      'PostgreSQL 连接字符串未设置。\n' +
      '请检查以下环境变量：\n' +
      '- POSTGRES_URL\n' +
      '- POSTGRES_PRISMA_URL\n' +
      '- STORAGE_URL（如果使用了自定义前缀）\n\n' +
      '在 Vercel Dashboard 中：\n' +
      '1. 进入 Storage 标签\n' +
      '2. 点击你的数据库\n' +
      '3. 查看 Connection String\n' +
      '4. 或者在连接时设置 Custom Prefix 为 "POSTGRES"'
    );
  }

  // 使用 createClient() 创建客户端
  client = createClient({
    connectionString: postgresUrl
  });
  
  return client;
}

// 初始化数据库表结构（仅在首次运行时执行）
let initialized = false;

async function ensureInitialized() {
  if (initialized) return;
  
  const client = getClient();
  
  try {
    // 创建表（如果不存在）
    await client.sql`
      CREATE TABLE IF NOT EXISTS flowcharts (
        id SERIAL PRIMARY KEY,
        project_name TEXT NOT NULL UNIQUE,
        data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // 创建索引
    await client.sql`
      CREATE INDEX IF NOT EXISTS idx_flowcharts_updated_at 
      ON flowcharts(updated_at DESC);
    `;
    
    await client.sql`
      CREATE INDEX IF NOT EXISTS idx_flowcharts_project_name 
      ON flowcharts(project_name);
    `;
    
    // PostgreSQL 使用函数和触发器来更新 updated_at
    await client.sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    
    await client.sql`
      DROP TRIGGER IF EXISTS update_flowcharts_timestamp ON flowcharts;
    `;
    
    await client.sql`
      CREATE TRIGGER update_flowcharts_timestamp
      BEFORE UPDATE ON flowcharts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `;
    
    initialized = true;
    console.log('✅ Database initialized');
  } catch (error) {
    // 如果表已存在，忽略错误
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      initialized = true;
      return;
    }
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * 获取准备好的语句（PostgreSQL 版本）
 */
export async function getStatements() {
  await ensureInitialized();
  
  const client = getClient();
  
  return {
    getAll: async () => {
      const result = await client.sql`
        SELECT * FROM flowcharts 
        ORDER BY updated_at DESC
      `;
      return result.rows;
    },
    
    getById: async (id) => {
      const result = await client.sql`
        SELECT * FROM flowcharts 
        WHERE id = ${id}
      `;
      return result.rows[0] || null;
    },
    
    getByProjectName: async (projectName) => {
      const result = await client.sql`
        SELECT * FROM flowcharts 
        WHERE project_name = ${projectName}
      `;
      return result.rows[0] || null;
    },
    
    create: async (projectName, data) => {
      const result = await client.sql`
        INSERT INTO flowcharts (project_name, data)
        VALUES (${projectName}, ${data})
        RETURNING id
      `;
      return {
        lastInsertRowid: result.rows[0].id,
        changes: 1,
        row: result.rows[0]
      };
    },
    
    update: async (projectName, data, id) => {
      const result = await client.sql`
        UPDATE flowcharts 
        SET project_name = ${projectName}, 
            data = ${data},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
      return {
        changes: result.rowCount || 0
      };
    },
    
    delete: async (id) => {
      const result = await client.sql`
        DELETE FROM flowcharts 
        WHERE id = ${id}
      `;
      return {
        changes: result.rowCount || 0
      };
    },
    
    search: async (searchTerm) => {
      const result = await client.sql`
        SELECT * FROM flowcharts 
        WHERE project_name LIKE ${searchTerm}
        ORDER BY updated_at DESC
      `;
      return result.rows;
    }
  };
}


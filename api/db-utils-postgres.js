// Vercel Postgres 数据库工具
// 使用此文件替代 db-utils.js 以支持持久化存储
import { sql } from '@vercel/postgres';

// 初始化数据库表结构（仅在首次运行时执行）
let initialized = false;

async function ensureInitialized() {
  if (initialized) return;
  
  try {
    // 创建表（如果不存在）
    await sql`
      CREATE TABLE IF NOT EXISTS flowcharts (
        id SERIAL PRIMARY KEY,
        project_name TEXT NOT NULL UNIQUE,
        data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // 创建索引
    await sql`
      CREATE INDEX IF NOT EXISTS idx_flowcharts_updated_at 
      ON flowcharts(updated_at DESC);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_flowcharts_project_name 
      ON flowcharts(project_name);
    `;
    
    // PostgreSQL 使用函数和触发器来更新 updated_at
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    
    await sql`
      DROP TRIGGER IF EXISTS update_flowcharts_timestamp ON flowcharts;
    `;
    
    await sql`
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
  
  return {
    getAll: async () => {
      const result = await sql`
        SELECT * FROM flowcharts 
        ORDER BY updated_at DESC
      `;
      return result.rows;
    },
    
    getById: async (id) => {
      const result = await sql`
        SELECT * FROM flowcharts 
        WHERE id = ${id}
      `;
      return result.rows[0] || null;
    },
    
    getByProjectName: async (projectName) => {
      const result = await sql`
        SELECT * FROM flowcharts 
        WHERE project_name = ${projectName}
      `;
      return result.rows[0] || null;
    },
    
    create: async (projectName, data) => {
      const result = await sql`
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
      const result = await sql`
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
      const result = await sql`
        DELETE FROM flowcharts 
        WHERE id = ${id}
      `;
      return {
        changes: result.rowCount || 0
      };
    },
    
    search: async (searchTerm) => {
      const result = await sql`
        SELECT * FROM flowcharts 
        WHERE project_name LIKE ${searchTerm}
        ORDER BY updated_at DESC
      `;
      return result.rows;
    }
  };
}


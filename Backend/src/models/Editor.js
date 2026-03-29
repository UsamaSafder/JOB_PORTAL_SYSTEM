const { getPool, sql } = require('../../config/database');

class Editor {
  /**
   * Create a new editor/revision record.
   * changeData: { userId, entity, entityId, changeType, change (JSON/string), notes }
   */
  static async create(changeData) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('userId', sql.Int, changeData.userId)
        .input('entity', sql.NVarChar, changeData.entity)
        .input('entityId', sql.Int, changeData.entityId)
        .input('changeType', sql.NVarChar, changeData.changeType || 'update')
        .input('change', sql.NVarChar, changeData.change)
        .input('notes', sql.NVarChar, changeData.notes)
        .query(`
          INSERT INTO Editors (userId, entity, entityId, changeType, change, notes)
          OUTPUT INSERTED.*
          VALUES (@userId, @entity, @entityId, @changeType, @change, @notes)
        `);

      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findById(id) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`SELECT e.*, u.email as userEmail FROM Editors e LEFT JOIN Users u ON e.userId = u.id WHERE e.id = @id`);

      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findAll(filters = {}) {
    try {
      const pool = await getPool();
      let query = `SELECT e.*, u.email as userEmail FROM Editors e LEFT JOIN Users u ON e.userId = u.id WHERE 1=1`;
      const request = pool.request();

      if (filters.userId) {
        query += ' AND e.userId = @userId';
        request.input('userId', sql.Int, filters.userId);
      }

      if (filters.entity) {
        query += ' AND e.entity = @entity';
        request.input('entity', sql.NVarChar, filters.entity);
      }

      if (filters.entityId) {
        query += ' AND e.entityId = @entityId';
        request.input('entityId', sql.Int, filters.entityId);
      }

      if (filters.changeType) {
        query += ' AND e.changeType = @changeType';
        request.input('changeType', sql.NVarChar, filters.changeType);
      }

      if (filters.search) {
        query += ' AND (e.notes LIKE @search OR e.change LIKE @search)';
        request.input('search', sql.NVarChar, `%${filters.search}%`);
      }

      query += ' ORDER BY e.createdAt DESC';

      if (filters.limit) {
        query += ` OFFSET ${filters.offset || 0} ROWS FETCH NEXT ${filters.limit} ROWS ONLY`;
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }

  static async update(id, data) {
    try {
      const pool = await getPool();
      const request = pool.request();
      let updateFields = [];

      if (data.change !== undefined) {
        updateFields.push('change = @change');
        request.input('change', sql.NVarChar, data.change);
      }

      if (data.notes !== undefined) {
        updateFields.push('notes = @notes');
        request.input('notes', sql.NVarChar, data.notes);
      }

      if (data.changeType !== undefined) {
        updateFields.push('changeType = @changeType');
        request.input('changeType', sql.NVarChar, data.changeType);
      }

      if (updateFields.length === 0) return null;

      updateFields.push('updatedAt = GETDATE()');

      request.input('id', sql.Int, id);
      const query = `UPDATE Editors SET ${updateFields.join(', ')} OUTPUT INSERTED.* WHERE id = @id`;
      const result = await request.query(query);

      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async delete(id) {
    try {
      const pool = await getPool();
      await pool.request().input('id', sql.Int, id).query('DELETE FROM Editors WHERE id = @id');
      return true;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Editor;

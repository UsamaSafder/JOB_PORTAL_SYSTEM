const { getPool, sql } = require('../../config/database');

class Job {
	static async create(jobData) {
		try {
			const pool = await getPool();
			const result = await pool.request()
				.input('companyId', sql.Int, jobData.companyId)
				.input('title', sql.NVarChar, jobData.title)
				.input('description', sql.NVarChar, jobData.description)
				.input('requirements', sql.NVarChar, jobData.requirements)
				.input('responsibilities', sql.NVarChar, jobData.responsibilities)
				.input('location', sql.NVarChar, jobData.location)
				.input('jobType', sql.NVarChar, jobData.jobType)
				.input('experienceLevel', sql.NVarChar, jobData.experienceLevel)
				.input('salaryMin', sql.Decimal(18, 2), jobData.salaryMin)
				.input('salaryMax', sql.Decimal(18, 2), jobData.salaryMax)
				.input('salaryCurrency', sql.NVarChar, jobData.salaryCurrency || 'USD')
				.input('category', sql.NVarChar, jobData.category)
				.input('skills', sql.NVarChar, jobData.skills)
				.input('benefits', sql.NVarChar, jobData.benefits)
				.input('openings', sql.Int, jobData.openings || 1)
				.input('deadline', sql.Date, jobData.deadline)
				.input('status', sql.NVarChar, jobData.status || 'active')
				.query(`
					INSERT INTO Jobs (companyId, title, description, requirements, responsibilities, 
						location, jobType, experienceLevel, salaryMin, salaryMax, salaryCurrency, 
						category, skills, benefits, openings, deadline, status)
					OUTPUT INSERTED.*
					VALUES (@companyId, @title, @description, @requirements, @responsibilities,
						@location, @jobType, @experienceLevel, @salaryMin, @salaryMax, @salaryCurrency,
						@category, @skills, @benefits, @openings, @deadline, @status)
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
				.query(`
					SELECT j.*, c.companyName, c.logo, c.city as companyCity, c.website,
						(SELECT COUNT(*) FROM Applications WHERE jobId = j.id) as applicationCount
					FROM Jobs j
					INNER JOIN Companies c ON j.companyId = c.id
					WHERE j.id = @id
				`);
      
			// Increment view count
			await pool.request()
				.input('id', sql.Int, id)
				.query('UPDATE Jobs SET viewCount = viewCount + 1 WHERE id = @id');
      
			return result.recordset[0];
		} catch (err) {
			throw err;
		}
	}

	static async findAll(filters = {}) {
		try {
			const pool = await getPool();
			let query = `
				SELECT j.*, c.companyName, c.logo, c.city as companyCity,
					(SELECT COUNT(*) FROM Applications WHERE jobId = j.id) as applicationCount
				FROM Jobs j
				INNER JOIN Companies c ON j.companyId = c.id
				WHERE 1=1
			`;
			const request = pool.request();

			if (filters.companyId) {
				query += ' AND j.companyId = @companyId';
				request.input('companyId', sql.Int, filters.companyId);
			}

			if (filters.status) {
				query += ' AND j.status = @status';
				request.input('status', sql.NVarChar, filters.status);
			}

			if (filters.jobType) {
				query += ' AND j.jobType = @jobType';
				request.input('jobType', sql.NVarChar, filters.jobType);
			}

			if (filters.location) {
				query += ' AND j.location LIKE @location';
				request.input('location', sql.NVarChar, `%${filters.location}%`);
			}

			if (filters.category) {
				query += ' AND j.category = @category';
				request.input('category', sql.NVarChar, filters.category);
			}

			if (filters.search) {
				query += ' AND (j.title LIKE @search OR j.description LIKE @search OR c.companyName LIKE @search)';
				request.input('search', sql.NVarChar, `%${filters.search}%`);
			}

			if (filters.skills) {
				query += ' AND j.skills LIKE @skills';
				request.input('skills', sql.NVarChar, `%${filters.skills}%`);
			}

			query += ' ORDER BY j.createdAt DESC';
      
			if (filters.limit) {
				query += ` OFFSET ${filters.offset || 0} ROWS FETCH NEXT ${filters.limit} ROWS ONLY`;
			}

			const result = await request.query(query);
			return result.recordset;
		} catch (err) {
			throw err;
		}
	}

	static async update(id, jobData) {
		try {
			const pool = await getPool();
			const request = pool.request();
			let updateFields = [];
      
			const allowedFields = ['title', 'description', 'requirements', 'responsibilities', 
				'location', 'jobType', 'experienceLevel', 'salaryMin', 'salaryMax', 'salaryCurrency',
				'category', 'skills', 'benefits', 'openings', 'deadline', 'status'];
      
			allowedFields.forEach(field => {
				if (jobData[field] !== undefined) {
					updateFields.push(`${field} = @${field}`);
					if (field === 'salaryMin' || field === 'salaryMax') {
						request.input(field, sql.Decimal(18, 2), jobData[field]);
					} else if (field === 'openings') {
						request.input(field, sql.Int, jobData[field]);
					} else if (field === 'deadline') {
						request.input(field, sql.Date, jobData[field]);
					} else {
						request.input(field, sql.NVarChar, jobData[field]);
					}
				}
			});
      
			if (updateFields.length === 0) return null;
      
			updateFields.push('updatedAt = GETDATE()');
			request.input('id', sql.Int, id);
      
			const query = `UPDATE Jobs SET ${updateFields.join(', ')} OUTPUT INSERTED.* WHERE id = @id`;
			const result = await request.query(query);
      
			return result.recordset[0];
		} catch (err) {
			throw err;
		}
	}

	static async delete(id) {
		try {
			const pool = await getPool();
			await pool.request()
				.input('id', sql.Int, id)
				.query('DELETE FROM Jobs WHERE id = @id');
      
			return true;
		} catch (err) {
			throw err;
		}
	}

	static async getRecommendedJobs(candidateId, limit = 10) {
		try {
			const pool = await getPool();
			const result = await pool.request()
				.input('candidateId', sql.Int, candidateId)
				.input('limit', sql.Int, limit)
				.query(`
					SELECT TOP (@limit) j.*, c.companyName, c.logo, c.city as companyCity,
						(SELECT COUNT(*) FROM Applications WHERE jobId = j.id) as applicationCount
					FROM Jobs j
					INNER JOIN Companies c ON j.companyId = c.id
					INNER JOIN Candidates can ON can.id = @candidateId
					WHERE j.status = 'active'
						AND NOT EXISTS (
							SELECT 1 FROM Applications 
							WHERE jobId = j.id AND candidateId = @candidateId
						)
						AND (
							can.skills LIKE '%' + j.skills + '%'
							OR j.skills LIKE '%' + can.skills + '%'
						)
					ORDER BY j.createdAt DESC
				`);
      
			return result.recordset;
		} catch (err) {
			throw err;
		}
	}
}

module.exports = Job;

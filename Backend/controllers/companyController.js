const Company = require('../models/Company');
const { convertToCamelCase } = require('../utils/helper');

const companyController = {
  // Public company profile endpoint
  getCompanyById: async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);

      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Convert to camelCase and return the company object
      res.json(convertToCamelCase(company));
    } catch (error) {
      console.error('Get company by id error:', error);
      res.status(500).json({ error: 'Failed to fetch company', message: error.message });
    }
  }
};

module.exports = companyController;

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const singletonUserMiddleware = require('../middleware/singletonUserMiddleware');

// All routes require authentication
router.use(singletonUserMiddleware);

router.get('/customers', customerController.getCustomers);
router.get('/customers/:id', customerController.getCustomerById);
router.post('/customers', customerController.createCustomer);
router.put('/customers/:id', customerController.updateCustomer);
router.delete('/customers/:id', customerController.deleteCustomer);

module.exports = router;

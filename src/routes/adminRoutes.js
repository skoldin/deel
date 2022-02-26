const express = require('express');
const router = express.Router()
const {AdminService} = require('../services/adminService')

const adminService = new AdminService()

router.get('/admin/best-profession', adminService.getMaxJobsSum)
router.get('/admin/best-clients', adminService.getMaxPaidClients)

module.exports = router

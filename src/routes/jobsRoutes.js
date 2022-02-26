const express = require('express');
const router = express.Router()
const {JobsService} = require('../services/jobsService')
const {getProfile} = require('../middleware/getProfile')

const jobsService  = new JobsService();

router.use(getProfile)

router.get('/jobs/unpaid', jobsService.getUnpaidJobs)
router.post('/jobs/:job_id/pay', jobsService.payForJob)

module.exports = router

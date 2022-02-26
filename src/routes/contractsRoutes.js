const express = require('express');
const router = express.Router()
const {ContractsService} = require('../services/contractsService')
const {getProfile} = require('../middleware/getProfile')

const contractsService = new ContractsService()

router.use(getProfile)

router.get('/contracts/:id', contractsService.getContract)
router.get('/contracts', contractsService.getContracts)

module.exports = router

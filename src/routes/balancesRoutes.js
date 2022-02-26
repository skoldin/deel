const express = require('express');
const router = express.Router()
const { BalancesService } = require('../services/balancesService')
const {getProfile} = require('../middleware/getProfile')

const balancesService = new BalancesService()

router.use(getProfile)

router.post('/balances/deposit/:userId', balancesService.addDeposit)

module.exports = router

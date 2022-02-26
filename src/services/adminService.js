const {Op} = require('sequelize');
const {sequelize} = require('../model');

class AdminService {
    getDate(date) {
        if (!date) {
            return null
        }
        return new Date(date)
    }

    isValidDate(date) {
        if (date === null) {
            return true
        }
        return !Number.isNaN(Number(date))
    }

    getDateFilter(startDate, endDate) {
        const result = {}

        if (startDate) {
            result[Op.gte] = startDate
        }

        if (endDate) {
            result[Op.lte] = endDate
        }

        return result
    }

    getMaxJobsSum = async (req, res, next) => {
        try {
            const {Job, Contract, Profile} = req.app.get('models')
            // assume "contactor that worked in the query time range" is where job's payment date between the filter dates
            // assume date is passed in "yyyy-mm-dd" format
            const {start, end} = req.query;

            const startDate = this.getDate(start)
            const endDate = this.getDate(end)

            if (!(this.isValidDate(startDate) && this.isValidDate(endDate))) {
                return res.status(400).json({error: 'The date needs to be in the YYYY-MM-DD format'})
            }

            const result = await Job.findAll({
                attributes: ['Contract.Contractor.profession', [sequelize.fn('sum', sequelize.col('price')), 'total']],
                include: [{
                    model: Contract,
                    include: [{
                        attributes: ['profession'],
                        model: Profile,
                        as: 'Contractor'
                    }]
                }],
                where: {
                    paid: 1,
                    paymentDate: this.getDateFilter(startDate, endDate)
                },
                group: ['Contract.Contractor.profession'],
                order: [sequelize.literal(`total DESC`)],
                limit: 1 // get only the largest
            })
            res.json({profession: result[0].Contract.Contractor.profession})
        } catch (err) {
            next(err)
        }
    }

    getMaxPaidClients = async (req, res, next) => {
        try {
            const {Job, Contract, Profile} = req.app.get('models')
            // assume "contactor that worked in the query time range" is where job's payment date between the filter dates
            // assume date is passed in "yyyy-mm-dd" format
            const {start, end, limit = 2} = req.query;

            if (!Number.isFinite(+limit)) {
                res.status(400).json({error: `Incorrect limit value: ${limit}`})
            }

            const startDate = this.getDate(start)
            const endDate = this.getDate(end)

            if (!(this.isValidDate(startDate) && this.isValidDate(endDate))) {
                return res.status(400).json({error: 'The date needs to be in the YYYY-MM-DD format'})
            }

            const result = await Job.findAll({
                attributes: [
                    'Contract.ClientId',
                    [sequelize.literal("`Contract->Client`.`firstName` || ' ' || `Contract->Client`.`lastName`"), 'fullName'],
                    [sequelize.fn('sum', sequelize.col('price')), 'paid']],
                include: [{
                    model: Contract,
                    include: [{
                        attributes: ['id', 'firstName', 'lastName'],
                        model: Profile,
                        as: 'Client'
                    }]
                }],
                where: {
                    paid: 1,
                    paymentDate: this.getDateFilter(startDate, endDate)
                },
                group: ['Contract.Client.id'],
                order: [sequelize.literal(`paid DESC`)],
                limit
            })

            res.json(result.map(item => {
                const {paid, Contract} = item
                const fullName = item.get('fullName')
                return {
                    fullName,
                    paid,
                    id: Contract.ClientId,
                }
            }))
        } catch (err) {
            next(err)
        }
    }
}

module.exports = {
    AdminService
}

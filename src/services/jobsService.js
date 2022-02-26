const {sequelize} = require('../model');
const Sequelize = require('sequelize');

const profileTypeToId = {
    'client': 'ClientId',
    'contractor': 'ContractorId'
}

class JobsService {
    async getUnpaidJobs(req, res, next) {
        try {
            const {Job, Contract} = req.app.get('models')

            const jobs = await Job.findAll({
                where: {
                    // assume that unpaid jobs have this field set to null as it is in the database now
                    // a better solution would be to have this field not-nullable with default of 0
                    paid: null
                },
                include: {
                    // assume we need only job data without the contract
                    attributes: [],
                    model: Contract,
                    where: {
                        // I assume "active" contracts are those that are in progress
                        status: 'in_progress',
                        [profileTypeToId[req.profile.type]]: req.profile.id
                    }
                }
            })

            res.json(jobs)
        } catch (err) {
            next(err)
        }
    }

    async payForJob(req, res, next) {
        try {
            const {Job, Contract, Profile} = req.app.get('models')
            const {job_id} = req.params

            // it seems to make sense to allow paying only if the current account is a client
            // for simplicity I will not check if the contract belongs to this client but it probably makes sense
            if (req.profile.type !== 'client') {
                res.status(403).json({error: 'Only a client account can pay for a job'})
            }

            // assume we pay only whole payment
            const job = await Job.findOne({
                attributes: ['price', 'paid'],
                include: [{
                    attributes: ['ContractorId'],
                    model: Contract
                }],
                where: {id: job_id}
            })

            if (!job) {
                return res.status(404).json({error: 'Job not found'})
            }

            const {price, paid, Contract: {ContractorId: contractorId}} = job;

            if (paid) {
                return res.json({error: 'Job is already paid for'})
            }

            // do payment
            await sequelize.transaction(async t => {
                // we probably cannot rely on the balance loaded into the req.profile since it could change
                const {balance} = await Profile.findOne({attributes: ['balance'], where: {id: req.profile.id}})

                if (balance < price) {
                    throw new Error('Not enough balance')
                }

                await Profile.update({
                    balance: balance - price
                }, {
                    transaction: t,
                    where: {
                        id: req.profile.id
                    }
                })

                await Profile.update({
                    balance: Sequelize.literal(`balance + ${price}`)
                }, {
                    transaction: t,
                    where: {
                        id: contractorId
                    }
                })

                await Job.update({
                    paid: 1
                }, {
                    transaction: t,
                    where: {
                        id: job_id
                    }
                })
            });

            res.json({message: `The job ${job_id} was successfully paid for`})
        } catch (err) {
            next(err)
        }
    }
}

module.exports = {
    JobsService
}

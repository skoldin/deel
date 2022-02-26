const Sequelize = require('sequelize');

class BalancesService {
    async addDeposit(req, res) {
        const {Profile, Job, Contract} = req.app.get('models')
        const {userId} = req.params

        // check if the account to deposit is a client
        const {type} = await Profile.findOne({
            attributes: ['type'],
            where: {
                id: userId
            }
        })

        if (type !== 'client') {
            return res.json({error: 'This is not a client account'})
        }

        // I assume "total of jobs to pay" is relevant to the account that makes the query, not necessarily the one we deposit
        // I also assume that the amount to deposit comes from the request as raw json {"amount": 100}
        const totalToPay = await Job.sum('price', {
            where: {
                paid: null,
            },
            include: [{
                model: Contract,
                where: {
                    ClientId: req.profile.id
                }
            }]
        })

        const maxDeposit = totalToPay * 0.25
        const amount = req.body.amount;

        if (amount > maxDeposit) {
            return res.json({ error: `The deposit cannot be greater than ${maxDeposit}` })
        }

        await Profile.update({
            balance: Sequelize.literal(`balance + ${amount}`)
        }, {
           where: {
               id: userId
           }
        })

        res.json({ message: `Succesfully deposited ${amount} to the client ${userId}`})
    }
}

module.exports = {
    BalancesService
}

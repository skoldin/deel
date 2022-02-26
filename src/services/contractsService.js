const { Op } = require('sequelize');

const profileTypeToId = {
    'client': 'ClientId',
    'contractor': 'ContractorId'
}

class ContractsService {
    async getContract(req, res, next) {
       try {
           const {Contract} = req.app.get('models')
           const {id} = req.params

           // I assume a contract can be accessed both by client and contractor
           // the database structure could be improved by splitting Profiles into Clients and Contractors tables
           const contract = await Contract.findOne({
               where: {id, [profileTypeToId[req.profile.type]]: req.profile.id},
           })
           if (!contract) return res.status(404).end()

           res.json(contract)
       } catch (err) {
           next(err)
       }
    }

    async getContracts(req, res, next) {
       try {
           const {Contract} = req.app.get('models')

           const contracts = await Contract.findAll({
               where: {
                   [profileTypeToId[req.profile.type]]: req.profile.id,
                   status: {
                       // it would be better to store possible statuses in a enum/constant but I will omit it here for simplicity
                       [Op.ne]: 'terminated'
                   }
               }
           })

           res.json(contracts)
       } catch (err) {
           next(err)
       }
    }
}

module.exports = {
    ContractsService
}

const express = require('express');
const Router= express.Router()
const bodyParser = require('body-parser');
const {errorHandler} = require('./middleware/errorHandler')
const contractsRoutes = require('./routes/contractsRoutes')
const jobsRoutes = require('./routes/jobsRoutes')
const balanceRoutes = require('./routes/balancesRoutes')
const adminRoutes = require('./routes/adminRoutes')
const {sequelize} = require('./model')
const app = express();
app.use(bodyParser.json());

app.set('sequelize', sequelize)
app.set('models', sequelize.models)

Router.use([contractsRoutes, jobsRoutes, balanceRoutes, adminRoutes])

app.use(Router)

app.use(errorHandler)
module.exports = app;

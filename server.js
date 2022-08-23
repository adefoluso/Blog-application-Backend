const express = require('express');
const dotenv =  require('dotenv');
const app = express();
dotenv.config();
const dbConnect = require("./config/db/dbConnect")

//Import route controllers
const {usersRoute} = require('./route/usersRoute/usersRoute')
const {postRoute} = require("./route/postRoute/postRoute")

//Import error handlers
const {notFound, errorHandler} = require("./middleware/error/errrorHandler")


//Middleware
app.use(express.json());

//Users route
app.use('/api/users', usersRoute)

//post route
app.use('/api/posts', postRoute)




//database connection
dbConnect();


//error handlers
app.use(notFound)
app.use(errorHandler);


//SERVER
const PORT = process.env.PORT || 5000
app.listen(PORT, console.log(`server is running on port ${PORT}`));





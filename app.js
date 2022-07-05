const express = require('express');
const { db } = require('./db-conncetion');
const path = require('path');
const hbs = require('hbs');
const cookieParser = require('cookie-parser')

const app = express(); 

//parse url encoded bodies(as sent from forms)
app.use(express.urlencoded({extended: false}))

//parse json bodies(as sent by api clients)
app.use(express.json())

app.use(cookieParser())

db.connect((error)=>{
    if(error){
        console.log(error)
    }
    else{
        console.log("mysql connected")
    }
})

const publicDirectory = path.join(__dirname,'./public')
app.use(express.static(publicDirectory));

const partialsPath = path.join(__dirname,'./views/partials')
hbs.registerPartials(partialsPath)

app.set('view engine', 'hbs');

app.use('/', require('./routes/pages'));
app.use('/auth',require('./routes/auth'))

app.listen(3000,()=>{
    console.log('listening to port 3000')
})
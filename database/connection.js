const express = require('express')
const router = express.Router()
const {MongoClient} = require( 'mongodb' );

async function connect(call) {
    try {
const url = 'mongodb://127.0.0.1:27017'

const client = new MongoClient(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true
})
        await client.connect()
        let db = client.db('loginPage')
        call(db,client)
    } catch (error) {
       console.log(error); 
    }
}

module.exports={connect}
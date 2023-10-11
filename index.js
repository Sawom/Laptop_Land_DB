const express = require('express');
const cors = require('cors');
require('dotenv').config(); 

const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

//connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bsdjaxv.mongodb.net/?retryWrites=true&w=majority` ;
const client = new MongoClient(uri, { serverApi: {version: ServerApiVersion.v1, strict: true, deprecationErrors: true, }});

async function run(){
    try{
        await client.connect();

        // all collections
        const homeCollection = client.db('Laptop-Land').collection('homedata')

        // get home laptop data
        app.get('/homedata' , async(req, res)=>{
            const result = await homeCollection.find().toArray();
            res.send(result);
        })


    }
    finally{

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('laptop land is running');
})

app.listen(port, ()=> {
    console.log(`laptop land server running at ${port}` );
}) 
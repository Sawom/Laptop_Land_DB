const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const homeCollection = client.db('Laptop-Land').collection('homedata');
        const reviewsCollection = client.db('Laptop-Land').collection('homereview');
        const laptopCollection = client.db('Laptop-Land').collection('laptop');
        const aboutCollection = client.db('Laptop-Land').collection('about');
        const faqsCollection = client.db('Laptop-Land').collection('faqs');
        const termsCollection = client.db('Laptop-Land').collection('terms');

        // get home laptop data
        app.get('/homedata' , async(req, res)=>{
            const result = await homeCollection.find().toArray();
            res.send(result);
        })

        // get about data
        app.get('/about', async(req, res)=>{
            const result = await aboutCollection.find().toArray();
            res.send(result);
        })

        // get faqs data
        app.get('/faqs', async(req, res)=>{
            const result = await faqsCollection.find().toArray();
            res.send(result);
        })

        // get terms data
        app.get('/terms', async(req, res)=>{
            const result = await termsCollection.find().toArray();
            res.send(result);
        })

        // get reviews
        app.get('/homereview' , async(req, res)=>{
            const result = await reviewsCollection.find().toArray();
            res.send(result);
        } )

        // get laptops data
        app.get('/laptop', async(req, res)=>{
            const result = await laptopCollection.find().toArray();
            res.send(result);
        })

        // search
        app.get('/search/:name', async(req, res)=>{
            let result = await laptopCollection.find({
                "$or":[
                    {model: { $regex: req.params.name, $options: 'i'}},
                    {brand: { $regex: req.params.name, $options: 'i' }}
                ]
            }).toArray()
            console.log(result)
            res.send(result)
        })

        // dynamic route
        app.get('/laptop/:id', async(req, res)=>{
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await laptopCollection.findOne(query);
            res.send(result);
        })

    }
    finally{

    }
}

app.get('/', (req, res) => {
    res.send('laptop land is running');
})

app.listen(port, ()=> {
    console.log(`laptop land server running at ${port}` );
}) 

run().catch(err => console.log(err));
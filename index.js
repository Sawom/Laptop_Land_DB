const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();
const jwt = require('jsonwebtoken');

// middleware
app.use(cors());
app.use(express.json());

// verify jwt
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

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
        const cartCollection = client.db('Laptop-Land').collection('carts'); 
        const usersCollection = client.db('Laptop-Land').collection('users');

        // verify admin
        const verifyAdmin = async (req, res, next) =>{
            const email = req.decoded.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if(user?.role !== 'admin'){
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }

        // get all users
        app.get('/users', verifyJWT, verifyAdmin, async(req, res)=>{
            const result = await usersCollection.find().toArray();
            res.send(result);
        } )

        // delete user
        app.delete('/users/:id', async(req,res) =>{
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })

        // delete cart data
        app.delete('/carts/:id', async(req,res) =>{
            const id = req.params.id;
            const query  = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        } )

        // laptop delete
        app.delete('/laptop/:id',  verifyJWT, verifyAdmin, async(req, res)=>{
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await laptopCollection.deleteOne(query);
            res.send(result);
        })

        // add laptop
        app.post('/laptop', verifyJWT, verifyAdmin, async(req, res)=>{
            const newLaptop = req.body;
            const result = await laptopCollection.insertOne(newLaptop);
            res.send(result);
        } )

        // update laptop
        app.put('/laptop/:id', async(req, res)=>{
            const id = req.params.id;
            const updatedLaptop = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = {upsert: true};
            const updateDoc = {
                $set:{
                    code: updatedLaptop.code,
                    model: updatedLaptop.model,
                    brand: updatedLaptop.brand,
                    price: updatedLaptop.price,
                    processor: updatedLaptop.processor,
                    ram: updatedLaptop.ram,
                    ramtype: updatedLaptop.ramtype,
                    display: updatedLaptop.display,
                    storagecapacity: updatedLaptop.storagecapacity,
                    graphics: updatedLaptop.graphics,
                    keyboard: updatedLaptop.keyboard,
                    camera: updatedLaptop.camera,
                    speaker: updatedLaptop.speaker,
                    audio: updatedLaptop.audio,
                    network: updatedLaptop.network,
                    os: updatedLaptop.os,
                    weight: updatedLaptop.weight,
                    warranty: updatedLaptop.warranty,
                    description: updatedLaptop.description
                },
            };
            const result = await laptopCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        // check user admin or not
        app.get('/users/admin/:email', verifyJWT,  async(req, res)=>{
            const email = req.params.email;
            if(req.decoded.email !== email){
                res.send( {admin: false} )
            }
            const query = {email : email}
            const user = await usersCollection.findOne(query);
            const result = {admin: user?.role === 'admin'}
            res.send(result);
        } )

        // make admin
        app.patch('/users/admin/:id', async(req, res)=>{
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)}
            console.log(id)
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // post cart data to server
        app.post('/carts', async(req,res)=>{
            const item = req.body;
            const  result = await cartCollection.insertOne(item);
            res.send(result);
            console.log(item);
        })

        // post user both email and google
        app.post('/users', async(req, res)=>{
            const user = req.body;
            const query = {email: user.email};
            const existingUser = await usersCollection.findOne(query);
            console.log( 'existingUser: ', existingUser);
             if(existingUser){
                return res.send({ message: 'user already exists!' })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        // get cart data email wise
        app.get('/carts', verifyJWT, async(req, res)=>{
            const email = req.query.email;
            if(!email){
                res.send([]);
            }
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbidden access' })
            }
            const query = { email: email };
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        })

        //**** */ get all cart data
        app.get('/carts', verifyJWT, verifyAdmin, async(req, res)=>{
            const result = await cartCollection.find().toArray();
            res.send(result);
        })

        //************* product deliver status
        app.patch('/carts/delivered/:id', async(req,res)=>{
            const id= req.params.id;
            const filter = {_id: new ObjectId(id)}
            const updateDoc = {
                $set:{
                    status: 'delivered'
                },
            }
            const result = await cartCollection.updateOne(filter , updateDoc);
            res.send(result);
        })

        // create jwt token.
        app.post('/jwt', (req,res)=>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '12h'})
            res.send({token})
        } )
        
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
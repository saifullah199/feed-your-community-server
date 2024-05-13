const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express()

const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m4mzgzp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares
const logger = (req,res, next) => {
  console.log(req.method, req.url);
  next();
}

const verifyToken = (req,res,next) => {
  const token = req?.cookies?.token;
  // console.log('token in the middlewre', token)
  if(!token){
    return res.send({message: 'unauthorized access'})
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.user = decoded;
    next();
  })
  
}

async function run() {
  try {
    const foodCollection = client.db('foodDB').collection('foods')
    const requestCollection = client.db('foodDB').collection('myReqs')

    // jwt generate
    app.post('/jwt', async(req,res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
      })
      res.cookie('token',token,{
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      .send({success: true})
    })

    app.post('/logout', async(req,res)=> {
      const user = req.body;
      console.log('loggging out', user);
      res.clearCookie('token', {maxAge:0}).send({success:true})
    })

    // get foods 
    app.get('/foods', async(req,res) => {
        const result = await foodCollection.find().toArray()
        res.send(result)
    })

    // get food by id
    app.get('/foods/:id', async(req,res) => {
      const id = req.params.id;
      console.log('token owner info', req.user)
      
      const query = {_id: new ObjectId(id)}
      const result = await foodCollection.findOne(query)
      res.send(result)
    }) 

    // update a food
    app.put('/food/:id', async(req,res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const options = {upsert: true}
      const updatedFood = req.body;
      const food = {
        $set: {
          name:updatedFood.name, 
          quantity:updatedFood.quantity, 
          location:updatedFood.location, 
          date:updatedFood.date, 
          notes:updatedFood.notes,
          foodImage:updatedFood.foodImage
        }
      }
      const result = await foodCollection.updateOne(filter, food, options )
      res.send(result)
    })

    // get a food by email
    app.get("/food/:email", logger,verifyToken, async(req,res) =>{
        console.log(req.params.email);
        console.log('token owner info', req.user)
        const result = await foodCollection.find({email: req.params.email}).toArray()
        res.send(result)
    })

    //  delete a single food 
    app.delete('/food/:id', async(req,res) =>{
        const id = req.params.id;
        console.log(id)
        const query = {_id: new ObjectId(id)}
        const result = await foodCollection.deleteOne(query)
        res.send(result)
    })


    // post foods to the the server and mongodb
    app.post('/foods', async(req,res) => {
        const newFood = req.body
        console.log(newFood)
        const result = await foodCollection.insertOne(newFood)
        res.send(result)

    })

    // post request food data to the DB
    app.post('/single', async(req,res) => {
      const newReqs = req.body

      console.log(newReqs)
      const result = await requestCollection.insertOne(newReqs)
      res.send(result)
      
    })

    // get all requested food
    app.get("/single", async(req,res) => {
        const result = await requestCollection.find().toArray()
        res.send(result)
    })

    // get a request food by email
    app.get("/singlefood/:email",logger,verifyToken, async(req,res) =>{
        console.log(req.params.email);
         console.log('token owner info', req.user)
        //  if(req.user.email !== req.query.email){
        //   return res.status(403).send({message: 'forbidden access'})
        //  }
        const result = await requestCollection.find({email: req.params.email}).toArray()
        res.send(result)
    })

    // update request status
    app.patch('/singlefood/:id', async(req,res) => {
      const id = req.params.id
      const updatedStatus = req.body;
      const query = {_id: new ObjectId(id)}
      const updateDoc = {
        $set: {status:updatedStatus.status},
      }
      const result = await foodCollection.updateOne(query,updateDoc)
      res.send(result)
    })
    
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   
  }
}
run().catch(console.dir);


app.get('/', (req,res) => {
    res.send('Food server is running')
})

app.listen(port, () => {
    console.log(`Food server is running on port: ${port}`)
})

const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express()

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m4mzgzp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const foodCollection = client.db('foodDB').collection('foods')

    // get foods 
    app.get('/foods', async(req,res) => {
        const result = await foodCollection.find().toArray()
        res.send(result)
    })
    // post foods to the the server and mongodb
    app.post('/foods', async(req,res) => {
        const newFood = req.body
        console.log(newFood)
        const result = await foodCollection.insertOne(newFood)
        res.send(result)

    })
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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

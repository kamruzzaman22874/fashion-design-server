const express = require("express");
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const cors = require("cors");


app.use(cors());
app.use(express.json());




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.apl9htr.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const classesCollection = await client.db("fashionDesignDB").collection("classes")
        const usersCollection = await client.db("fashionDesignDB").collection("users")
        const productCollection = await client.db("fashionDesignDB").collection("products")
        const instructorCollection = await client.db("fashionDesignDB").collection("instructors")

        // users api 

        app.get("/users", async(req, res)=>{
            const result =  await usersCollection.find().toArray();
            res.send(result) ;
        })

        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user?.email };
            const existingUser = await usersCollection.findOne(query);
            // console.log(existingUser);
            if (existingUser) {
                return res.send({ message: "user already exists" });
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


        app.patch("/users/admin/:id", async (req, res) =>{
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const updateDoc = {
            $set: {
                role: "admin"
            },
          };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.send(result);
        })


        app.delete("/users/:id", async (req, res) =>{
            const id = req.params.id;
            const user = {_id: new ObjectId(id)}
            const result = await productCollection.deleteOne(user);
            res.send(result);
        })

        // classes api 

        app.get("/classes", async (req, res) => {
            const result = await classesCollection.find().sort({ availableSeat: -1 }).limit(6).toArray();
            res.send(result);
        });


        // products api 

        app.get("/products", async(req, res)=>{
            const email = req.query.email;
            if(!email){
                res.send([])
            }
            const query = {email: email}
            const result = await productCollection.find(query).toArray();
            res.send(result)
        } )

        app.post("/products", async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        })


        app.delete("/products/:id", async (req, res) =>{
            const id = req.params.id;
            const product = {_id: new ObjectId(id)}
            const result = await productCollection.deleteOne(product);
            res.send(result);
        })



        // Instructors api 


        app.get("/instructors", async (req, res) => {
            const topInstructors = await instructorCollection.find().sort({ studentsCount: -1 }).limit(6).toArray();
            res.send(topInstructors);
        })




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get("/", (req, res) => {
    res.send("Fashion design server is available")
})

app.listen(port, (req, res) => {
    console.log(`Fashion design server is available on ${port}`);
})



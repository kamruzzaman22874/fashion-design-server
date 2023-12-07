const express = require("express");
require('dotenv').config();
const cors = require("cors");
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware 
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers?.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: "Unauthorized token" });
    }
    const token = authorization.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: "Invalid token forbidden" });
        }
        req.decoded = decoded;
        next();
    })
}



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
        // await client.connect();

        const classesCollection = client.db("fashionDesignDB").collection("classes")
        const usersCollection = client.db("fashionDesignDB").collection("users")
        const productCollection = client.db("fashionDesignDB").collection("products")
        const paymentCollection = client.db("fashionDesignDB").collection("payments")
        const feturedCollection = client.db("fashionDesignDB").collection("fetured")

        // jwt 

        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
            res.send({ token });
        })

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded;
            console.log(email);
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user?.role !== "admin") {
                return res.status(401).send({ error: true, message: "forbidden provided" });
            }
            next()
        }

        // users api 

        app.get("/users", verifyJWT, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;

            // if(req.decoded.email !== email){
            //   res.send({admin:false})
            // }
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            // const result = { admin: user?.role === "admin" }
            res.send(user);
        })

        // app.get("/users/admin:email",verifyJWT, async(req, res)=>{
        //     const email = req.params.email;
        //     console.log("79 no", email)
        //     if(req.decoded !== email){
        //         res.send({admin: false})
        //     }
        //     const query = {email: email} ;
        //     console.log("Line number 84", query) ;
        //     const user = await usersCollection.findOne(query);
        //     const result = {admin: user?.role === 'admin'}
        //     res.send(result) ;
        // })

        app.patch("/users/admin/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: "admin"
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user?.email };
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: "user already exists" });
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const user = { _id: new ObjectId(id) }
            const result = await usersCollection.deleteOne(user);
            res.send(result);
        })


        // Instructor apis 

        app.get("/users/instructor", async (req, res) => {
            const filter = { role: "instructor" };
            const result = await usersCollection.find(filter).toArray();
            res.send(result);
        });

        app.get("/users/instructor/:email", async (req, res) => {
            const email = req.params.email;
            console.log(email)
            // if(req.decoded !==email){
            //     res.send({instructor: false})
            // }
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            // const result = {instructor: user?.role === 'instructor'}
            res.send(user);
        })
        app.get("/users/instructorClass/:email", async (req, res) => {
            const email = req.params.email;
            console.log(email)
            // if(req.decoded !==email){
            //     res.send({instructor: false})
            // }
            const query = { instructorEmail: email };
            const user = await classesCollection.find(query).toArray();
            // const result = {instructor: user?.role === 'instructor'}
            res.send(user);
        })

        app.patch("/users/instructor/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: "instructor"
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })


        // classes api 

        // app.get("/classes", async (req, res) => {
        //     const result = await classesCollection.find().sort({ availableSeat: -1 }).limit(6).toArray();
        //     res.send(result);
        // });


        // admin apis 


        app.patch("/classes/approve/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: "approved",
                },
            };
            const result = await classesCollection.updateOne(filter, updateDoc);
            res.send(result);
        });


        // app.patch("/classes/deny/:id", async (req, res) => {
        // const id = req.params.id;
        // const filter = { _id: new ObjectId(id) };
        // const updateDoc = {
        //     $set: {
        //     status: "denied",
        //     },
        // };
        // const result = await classesCollection.updateOne(filter, updateDoc);
        // res.send(result);
        // });


        app.patch('/classes/feedback/:id', async (req, res) => {
            const id = req.params.id;
            const { feedback } = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    feedback: feedback,
                },
            };
            const result = await classesCollection.updateOne(filter, updateDoc);
            res.send(result);

        })

        // app.patch("/admin/manageClasses/:id", async (req, res) => {
        //     const id = req.params.id;
        //     const filter= {_id: new ObjectId(id)}
        //     const status = req.headers.status;
        //     const updateDoc = {
        //         $set: {
        //            status: status ==="approve" ? "approved" : "denied",
        //         }
        //     }

        //     const result = await classesCollection.updateOne(filter,updateDoc)
        //     res.send(result);

        // })


        // products api 


        app.get("/classes", async (req, res) => {
            const result = await classesCollection.find().toArray();
            res.send(result);
        })

        app.get("/products/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await productCollection.find(query).toArray();
            res.send(result)
        })

        app.post("/products", async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        })


        app.delete("/products/:id", async (req, res) => {
            const id = req.params.id;
            const product = { _id: new ObjectId(id) }
            const result = await productCollection.deleteOne(product);
            res.send(result);
        })


        // Fetured apis 

        app.get("/fetured", async (req, res) => {
            const result = await feturedCollection.find().toArray();
            res.send(result);
        })



        // Instructors api 

        app.post("/classes", async (req, res) => {
            const newItem = req.body;
            const result = await classesCollection.insertOne(newItem);
            res.send(result);
        });

        app.get("/users/instructor", async (req, res) => {
            const filter = { role: "instructor" };
            const result = await usersCollection.find(filter).toArray();
            res.send(result);
        });


        app.get("/users/instructor/:email", async (req, res) => {
            const email = req.params.email;
            if (req.decoded !== email) {
                res.send({ instructor: false })
            }
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'instructor' }
            res.send(result);
        })


        // create payment intent 

        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })

        app.post("/payments", async (req, res) => {
            const payment = req.body;
            const insertResult = await paymentCollection.insertOne(payment);

            const query = { _id: { $in: payment.classesItems.map(id => new ObjectId(id)) } }
            const deleteResult = await productCollection.deleteMany(query);

            res.send({ insertResult, deleteResult });
        })


        app.get("/admin-stats", async (req, res) => {
            const user = await usersCollection.estimatedDocumentCount();
            const products = await productCollection.estimatedDocumentCount();
            const orders = await paymentCollection.estimatedDocumentCount();
            const payments = await paymentCollection.find().toArray();
            const revinue = payments.reduce((sum, payment) => sum + payment.price, 0)
            res.send({
                revinue,
                user,
                products,
                orders
            })
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



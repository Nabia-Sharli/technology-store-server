const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");
const res = require("express/lib/response");
const fileUpload = require('express-fileupload');
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET);

app.use(cors());
app.use(express.json({limit: '250mb'}));
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASS}@cluster0.yai2s.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("TechStoreDB");
    const productsCollection = database.collection("products");
    const reviewsCollection = database.collection("reviews");
    const ordersCollection = database.collection("orders");
    const usersCollection = database.collection("users");

    // get all products
    app.get("/products", async (req, res) => {
      const products = await productsCollection.find({}).toArray();
      res.send(products);
    });

    // delete product
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // get specific one product
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productsCollection.findOne(query);
      res.send(product);
    });

    // get all reviews
    app.get("/reviews", async (req, res) => {
      const reviews = await reviewsCollection.find({}).toArray();
      res.send(reviews);
    });

    // post order to DB
    app.post("/orders", async (req, res) => {
      const data = req.body;
      // console.log(data);
      const result = await ordersCollection.insertOne(data);
      res.send(result);
    });

    // order filter from database by email
    app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    });

    // get all orders
    app.get("/orders", async (req, res) => {
      const orders = await ordersCollection.find({}).toArray();
      res.send(orders);
    });

    // customer cancel order
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.send(result);
    });

    // customer review send
    app.post("/CustomerReviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // update status order
    app.put("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "Shipped",
        },
      };
      const result = await ordersCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // save user to database
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // check admin or not
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.put("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // image upload with add product
      app.post('/addProduct', async (req, res) => {
          const name = req.body.name;
          const brand = req.body.brand;
          const processor = req.body.processor;
          const ram = req.body.ram;
          const hdd = req.body.hdd;
          const sdd = req.body.sdd;
          const gen = req.body.gen;
          const price = req.body.price;
          const description = req.body.description;
          const myImage = req.files.image;

          const picData = myImage.data;
          const encodedPic = picData.toString('base64');
          const image = Buffer.from(encodedPic, 'base64');
        
          const product = { name, brand, processor, ram, hdd, sdd, price, description, image, gen };
          
          const result = await productsCollection.insertOne(product);
          res.send(result);
      })

    app.get('/order/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.findOne(query);
      res.send(result);
    })

    // make an admin
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      if (query) {
        const updateDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await usersCollection.updateOne(query, updateDoc);
        res.send(result);
      }
    });

    app.post('/create-payment-intent', async (req, res) => {
      const paymentInfo = req.body;
      const amount = +paymentInfo.price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: 'usd',
        amount: amount,
        payment_method_types: ['card']
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    })

    app.put('/payments/:id', async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          payment: payment
        }
      };
      const result = await ordersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Technology Store Server Running...");
});

app.listen(port, () => {
  console.log("Technology Store Server running on port", port);
});

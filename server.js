const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');

// Create an Express app
const app = express();
const port = 3001;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MongoDB Atlas connection string (with your password "yogeshp")
const uri = "mongodb+srv://yogeshp:yogeshp@cluster0.0six4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient instance with the connection string
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Connect to MongoDB once at the start
let database;
async function connectToDatabase() {
  try {
    await client.connect();
    database = client.db('userInputDB');
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
}

// Route to serve the HTML form and display the users
app.get('/', async (req, res) => {
  try {
    // Access the users collection
    const users = database.collection('users');

    // Fetch all users from the collection
    const userList = await users.find().toArray();

    // Create an HTML string with all users
    let userListHtml = '<ul>';
    userList.forEach(user => {
      userListHtml += `<li>${user.name} - ${user.email} 
                        <a href="/edit/${user._id}">Edit</a> 
                        <a href="/delete/${user._id}">Delete</a></li>`;
    });
    userListHtml += '</ul>';

    res.send(`
      <h1>Enter Your Details</h1>
      <form action="/submit" method="POST">
        <label for="name">Name:</label>
        <input type="text" id="name" name="name" required>
        <br><br>
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>
        <br><br>
        <button type="submit">Submit</button>
      </form>

      <h2>Existing Users</h2>
      ${userListHtml}
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching user data');
  }
});

// Route to handle form submission and save data to MongoDB
app.post('/submit', async (req, res) => {
  const { name, email } = req.body;

  try {
    // Access the users collection
    const users = database.collection('users');

    // Check if user with the same email already exists
    const existingUser = await users.findOne({ email: email });
    if (existingUser) {
      // Avoid inserting duplicate data
      return res.send("User with this email already exists. Please enter a different email.");
    }

    // Insert the new user data into the collection
    const newUser = { name, email };
    await users.insertOne(newUser);

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving user data');
  }
});

// Route to handle updating user data
app.get('/edit/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Access the users collection
    const users = database.collection('users');

    // Fetch the user data by ID
    const user = await users.findOne({ _id: new ObjectId(id) });

    if (user) {
      res.send(`
        <h1>Edit User</h1>
        <form action="/update/${id}" method="POST">
          <label for="name">Name:</label>
          <input type="text" id="name" name="name" value="${user.name}" required>
          <br><br>
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" value="${user.email}" required>
          <br><br>
          <button type="submit">Update</button>
        </form>
      `);
    } else {
      res.status(404).send('User not found');
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching user data for editing');
  }
});

// Route to handle updating user data after editing
app.post('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    // Access the users collection
    const users = database.collection('users');

    // Update the user data by ID
    await users.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, email } }
    );

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating user data');
  }
});

// Route to handle deleting a user
app.get('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Access the users collection
    const users = database.collection('users');

    // Delete the user by ID
    await users.deleteOne({ _id: new ObjectId(id) });

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting user');
  }
});

// Start the server and connect to MongoDB
app.listen(port, async () => {
  await connectToDatabase();
  console.log(`Server is running on http://localhost:${port}`);
});

const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch'); 
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require("./key.json");
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

app.post('/signupsubmit', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const snapshot = await db.collection('users').where('email', '==', email).get();

    if (!snapshot.empty) {
      return res.status(409).send('⚠️ Email already exists. Please use a different one.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection('users').add({
      username,
      email,
      password: hashedPassword,
    });

    res.redirect('/login');
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).send('❌ Error during signup.');
  }
});


app.post('/loginsubmit', async (req, res) => {
  const { email, password } = req.body;

  try {
    const snapshot = await db.collection('users').where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(401).send('❌ Invalid email or password.');
    }

    let isAuthenticated = false;

    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const match = await bcrypt.compare(password, userData.password);

      if (match) {
        isAuthenticated = true;
        return res.redirect('/player');
      }
    }

    if (!isAuthenticated) {
      res.status(401).send('❌ Invalid email or password.');
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('❌ Error during login.');
  }
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});

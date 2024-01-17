const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const firebase = require("firebase-admin");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Inicialize o Firebase
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

// Rotas
app.get("/posts", async (req, res) => {
  try {
    const snapshot = await firebase.database().ref("posts").once("value");
    const posts = snapshot.val();
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar posts." });
  }
});

app.post("/posts", async (req, res) => {
  try {
    const { title, content, status } = req.body;
    const timestamp = new Date().toISOString();
    const newPostRef = await firebase
      .database()
      .ref("posts")
      .push({ title, content, status, timestamp });
    res.json({ id: newPostRef.key, title, content, status, timestamp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar post." });
  }
});

// Rota para visualizar um post por ID
app.get("/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const snapshot = await firebase
      .database()
      .ref(`posts/${postId}`)
      .once("value");
    const post = snapshot.val();

    if (!post) {
      res.status(404).json({ error: "Post não encontrado." });
      return;
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar post por ID." });
  }
});

// Rota para editar um post por ID
app.put("/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content, status } = req.body;
    const timestamp = new Date().toISOString();

    await firebase.database().ref(`posts/${postId}`).update({ title, content, status, timestamp });

    res.json({ id: postId, title, content, status, timestamp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao editar post por ID." });
  }
});

// Rota para excluir um post por ID
app.delete("/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;

    await firebase.database().ref(`posts/${postId}`).remove();

    res.json({ message: "Post excluído com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir post por ID." });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
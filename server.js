import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import routes from "./routes/index.js";

dotenv.config();

const DB_NAME = process.env.MONGO_DB_NAME || 'Mobile';

const app = express();

app.use(cors());
app.use(express.json());

// Connect DB 
if (process.env.MONGO_URI) {
  // enable mongoose query debug
  mongoose.set('debug', false);

  // pass dbName in options so Mongoose uses the correct DB
  mongoose.connect(process.env.MONGO_URI, { dbName: DB_NAME })
    .then(() => {
      console.log('[server] MongoDB connected, db:', mongoose.connection.db?.databaseName);
    })
    .catch(err => {
      console.error('[server] MongoDB connection error:', err);
    });

  mongoose.connection.on('error', err => console.error('[mongoose] connection error', err));
  mongoose.connection.on('disconnected', () => console.warn('[mongoose] disconnected'));
} else {
  console.warn('No MONGO_URI found in environment — skipping DB connection (development mode).');
}

// Use routes
app.use("/api", routes);

// Simple ping endpoint for dev reachability checks
app.get('/api/_ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Root page: helpful landing when visiting the ngrok root URL
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Mobile Backend</title></head>
      <body style="font-family: sans-serif; line-height: 1.6; margin: 2rem;">
        <h1>Mobile Backend</h1>
        <p>This is a development server. Use the API endpoints under <code>/api</code>.</p>
        <ul>
          <li><a href="/api/_ping">/api/_ping</a> — ping endpoint (returns JSON)</li>
          <li><a href="/api/auth/register">/api/auth/register</a> — register (POST)</li>
        </ul>
        <p>If you reached this page via an ngrok URL, your tunnel is working and will forward API requests to the endpoints above.</p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () =>
  console.log(`Server running on http://${HOST}:${PORT}`)
);

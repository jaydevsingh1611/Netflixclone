import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express'
import { connectDB } from './server/configs/db.js';
const app = express();
const port = 3000;
await connectDB()

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());
app.listen(port, () => console.log(`Server Listening at ${port}`))
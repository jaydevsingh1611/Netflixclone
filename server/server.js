import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express'
import { connectDB } from './configs/db.js';
import { serve } from 'inngest/express';
import { inngest, functions } from './inngest/index.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';
import { showRouter } from './Routes/showRoutes.js';
import { bookingRouter } from './Routes/bookingRoutes.js';
import { adminRouter } from './Routes/adminRoutes.js';
import { userRouter } from './Routes/userRoutes.js';
const app = express();
const port = 3000;
await connectDB()

// Stripe webhooks Route
app.use('/api/stripe',express.raw({type: 'application/json'}), stripeWebhooks)
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/show", showRouter)
app.use("/api/booking", bookingRouter)
app.use("/api/admin", adminRouter)
app.use("/api/user", userRouter)
app.get("/", (req, res) => res.send("Server is Live!"))
app.listen(port, () => console.log(`Server Listening at ${port}`));
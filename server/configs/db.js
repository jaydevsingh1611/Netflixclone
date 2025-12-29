import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
    try {
        // If already connected, return early
        if (mongoose.connection.readyState === 1) {
            isConnected = true;
            return;
        }

        if (isConnected) {
            return;
        }

        mongoose.connection.on('connected', () => {
            console.log("Database Connected");
            isConnected = true;
        });

        mongoose.connection.on('error', (err) => {
            console.log("DB Error:", err.message);
            isConnected = false;
        });

        await mongoose.connect(`${process.env.MONGODB_URI}/netShow`);
    } catch (error) {
        console.log("DB Error:", error.message);
        isConnected = false;
    }
}

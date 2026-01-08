import { Booking } from "../models/Booking.js";
import { clerkClient } from "@clerk/express";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";


// API Controller Function to get User Bookings
export const getUserBookings = async (req, res) => {
    try {
        const user = req.auth().userId;
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        // Find bookings and filter out unpaid bookings older than 10 minutes
        const bookings = await Booking.find({ user }).populate({
            path: "show",
            populate: { path: "movie" }
        }).sort({ createdAt: -1 })
        
        // Filter out unpaid bookings that are older than 10 minutes
        const validBookings = bookings.filter(booking => {
            // Keep paid bookings
            if (booking.isPaid) return true;
            // Keep unpaid bookings that are less than 10 minutes old
            if (booking.createdAt > tenMinutesAgo) return true;
            // Exclude unpaid bookings older than 10 minutes
            return false;
        })
        
        // Clean up old unpaid bookings in the background
        const oldUnpaidBookings = bookings.filter(booking => {
            return !booking.isPaid && booking.createdAt <= tenMinutesAgo;
        });
        
        // Delete old unpaid bookings asynchronously
        if (oldUnpaidBookings.length > 0) {
            oldUnpaidBookings.forEach(async (booking) => {
                try {
                    // Release seats
                    const show = await Show.findById(booking.show);
                    if (show && booking.bookedSeats) {
                        booking.bookedSeats.forEach((seat) => {
                            delete show.occupiedSeats[seat];
                        });
                        show.markModified('occupiedSeats');
                        await show.save();
                    }
                    // Delete booking
                    await Booking.findByIdAndDelete(booking._id);
                } catch (err) {
                    console.error("Error cleaning up old booking:", err);
                }
            });
        }
        
        res.json({ success: true, bookings: validBookings })
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

//API Controller to Update favourite Movie in clerk User Metadata
export const updateFavorite = async (req, res) => {
    try {
        const { movieId } = req.body;
        const userId = req.auth().userId;
        const user = await clerkClient.users.getUser(userId)
        if (!user.privateMetadata.favorites) {
            user.privateMetadata.favorites = []
        }
        if (!user.privateMetadata.favorites.includes(movieId)) {
            user.privateMetadata.favorites.push(movieId)
        } else {
            user.privateMetadata.favorites = user.privateMetadata.favorites.filter(item => item !== movieId)
        }
        await clerkClient.users.updateUserMetadata(userId, { privateMetadata: user.privateMetadata })
        res.json({ success: true, message: "Added Successfully" })
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

// get Favorites
export const getFavorite = async (req, res) => {
    try {
        const  user = await clerkClient.users.getUser(req.auth().userId)
        const favorites = user.privateMetadata.favorites;
        const movies = await Movie.find({_id: {$in: favorites}})
        res.json({ success: true, movies})
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}





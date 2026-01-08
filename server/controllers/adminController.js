import { Booking } from "../models/Booking.js"
import Show from "../models/Show.js";
import User from "../models/User.js";


// API to check if user is admin
export const isAdmin = async (req, res) => {
    res.json({ success: true, isAdmin: true })
}
export const getDashboardData = async (req, res) => {
    try {
        const bookings = await Booking.find({ isPaid: true });
        const activeShows = await Show.find({}).populate('movie');
        // Note: User count would need to be fetched from Clerk if needed
        const totalUser = await User.countDocuments(); 
        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
            activeShows,
            totalUser
        }
        res.json({ success: true, dashboard: dashboardData })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get all shows
export const getAllShows = async (req, res) => {
    try {
        const shows = await Show.find({}).populate('movie').sort({ showDateTime: 1 })
        res.json({ success: true, shows })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// API to get all bookings
export const getAllBookings = async (req, res) => {
    try {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const bookings = await Booking.find({})
            .populate({
                path: 'user',
                select: 'name email', // Only select fields that exist
                options: { strictPopulate: false } // Allow null if user doesn't exist
            })
            .populate({
                path: "show",
                populate: { 
                    path: "movie",
                    options: { strictPopulate: false }
                },
                options: { strictPopulate: false }
            })
            .sort({ createdAt: -1 });
        
        // Filter out any bookings with invalid data and unpaid bookings older than 10 minutes
        const validBookings = bookings.filter(booking => {
            if (booking === null) return false;
            // Keep paid bookings
            if (booking.isPaid) return true;
            // Keep unpaid bookings that are less than 10 minutes old
            if (booking.createdAt > tenMinutesAgo) return true;
            // Exclude unpaid bookings older than 10 minutes
            return false;
        });
        
        // Clean up old unpaid bookings in the background
        const oldUnpaidBookings = bookings.filter(booking => {
            return booking !== null && !booking.isPaid && booking.createdAt <= tenMinutesAgo;
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
        console.error('Error fetching bookings:', error);
        res.json({ success: false, message: error.message })
    }
}




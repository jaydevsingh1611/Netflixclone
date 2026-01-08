import { inngest } from "../inngest/index.js";
import { Booking } from "../models/Booking.js";
import Show from "../models/Show.js"
import stripe from "stripe";

// Function to check availability of Selected seats for a movie
// excludeBookingId: If provided, seats occupied by this booking will be considered available
export const checkSeatsAvailability = async (showId, selectedSeats, excludeBookingId = null) => {
    try {
        const showData = await Show.findById(showId);
        if (!showData) return false;
        const occupiedSeats = showData.occupiedSeats;
        
        // If we're excluding a booking, find which user owns that booking
        let excludeUserId = null;
        if (excludeBookingId) {
            const excludeBooking = await Booking.findById(excludeBookingId);
            if (excludeBooking) {
                excludeUserId = excludeBooking.user.toString();
            }
        }
        
        // Check if any seat is taken by someone else (not the excluded booking)
        const isAnySeatTaken = selectedSeats.some(seat => {
            const occupiedBy = occupiedSeats[seat];
            if (!occupiedBy) return false; // Seat is free
            // If we're excluding a booking and the seat is occupied by that booking's user, it's available
            if (excludeUserId && occupiedBy === excludeUserId) return false;
            // Otherwise, the seat is taken
            return true;
        });
        
        return !isAnySeatTaken;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}
export const createBooking = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { showId, selectedSeats } = req.body;
        const {origin} = req.headers;
        if (!selectedSeats || selectedSeats.length === 0) {
            return res.json({ success: false, message: "Please select at least one seat" })
        }
        // Check if the seat is available for the selected show
        const isAvailable = await checkSeatsAvailability(showId, selectedSeats);
        if (!isAvailable) {
            return res.json({ success: false, message: "Selected Seats are not available" })
        }
        const showData = await Show.findById(showId).populate('movie');

        // create a new booking
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats
        })
        selectedSeats.map((seat) => {
            showData.occupiedSeats[seat] = userId;
        })
        showData.markModified('occupiedSeats');
        await showData.save();
        // Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        // Creating line items to do for stripe
        const line_items = [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: showData.movie.title
                },
                unit_amount: Math.floor(booking.amount) * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                bookingId: booking._id.toString()
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
            locale: 'en',
            payment_method_types: ['card'],
        })
        booking.paymentLink = session.url
        await booking.save()

        // Run inngest Function to check Payment status after 10 minutes
        await inngest.send({
            name: "app/checkpayment",
            data: {
                bookingId: booking._id.toString()
            }
        })
        
        res.json({ success: true, url: session.url })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

export const getOccupiedSeats = async (req, res) => {
    try {
        const { showId } = req.params;
        const showData = await Show.findById(showId)
        const occupiedSeats = Object.keys(showData.occupiedSeats)
        res.json({ success: true, occupiedSeats })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Function to regenerate payment link for an unpaid booking
export const regeneratePaymentLink = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { bookingId } = req.body;
        const { origin } = req.headers;
        
        // Find the booking and verify it belongs to the user
        // Populate show with movie to ensure we have all data
        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: {
                path: 'movie'
            }
        });
        
        if (!booking) {
            return res.json({ success: false, message: "Booking not found" });
        }
        
        if (booking.user.toString() !== userId) {
            return res.json({ success: false, message: "Unauthorized" });
        }
        
        if (booking.isPaid) {
            return res.json({ success: false, message: "Booking is already paid" });
        }
        
        // Check if booking is older than 10 minutes
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        if (booking.createdAt <= tenMinutesAgo) {
            return res.json({ success: false, message: "Booking has expired. Please create a new booking." });
        }
        
        // Get show ID (handle both populated and unpopulated)
        const showId = booking.show._id ? booking.show._id.toString() : booking.show.toString();
        
        // Check if seats are still available (excluding this booking's seats)
        const isAvailable = await checkSeatsAvailability(showId, booking.bookedSeats, bookingId);
        if (!isAvailable) {
            return res.json({ success: false, message: "Selected seats are no longer available" });
        }
        
        // Initialize Stripe
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        
        // Always fetch fresh show data with movie populated to ensure we have complete data
        const showData = await Show.findById(showId).populate('movie');
        
        // Verify show and movie data exists
        if (!showData) {
            return res.json({ success: false, message: "Show not found" });
        }
        
        if (!showData.movie) {
            return res.json({ success: false, message: "Movie information not found" });
        }
        
        // Validate movie title
        const movieTitle = showData.movie.title;
        if (!movieTitle || typeof movieTitle !== 'string' || movieTitle.trim() === '') {
            return res.json({ success: false, message: "Invalid movie title" });
        }
        
        // Validate amount
        const amount = Math.floor(booking.amount);
        if (!amount || amount <= 0 || isNaN(amount)) {
            return res.json({ success: false, message: "Invalid booking amount" });
        }
        
        // Create new Stripe checkout session with validated data
        const line_items = [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: movieTitle.trim()
                },
                unit_amount: amount * 100
            },
            quantity: 1
        }];
        
        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                bookingId: booking._id.toString()
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
            locale: 'en',
            payment_method_types: ['card'],
        });
        
        // Update booking with new payment link
        booking.paymentLink = session.url;
        await booking.save();

        //Run Inngest Scheduler Function to check payment status after 10 minutes
        await inngest.send({
        name:"app/checkpayment",
        data:{
        bookingId:booking._id.toString()
        }
        })
        res.json({ success: true, url: session.url });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

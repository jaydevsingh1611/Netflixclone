import React, { useEffect, useState } from "react";
import { Loading } from "../components/Loading";
import { BlurCircle } from "../components/BlurCircle";
import { dateFormat } from "../lib/dateFormat";
import { timeFormat } from "../lib/timeFormat";
import { useAppContext } from "../context/Appcontext";
export const MyBookings = () => {
    const currency = import.meta.env.VITE_CURRENCY
    const { axios, getToken, user, image_base_url } = useAppContext()
    const [bookings, setBookings] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [processingPaymentId, setProcessingPaymentId] = useState(null)
    
    const getMyBookings = async () => {
        try {
            const { data } = await axios.get('/api/user/bookings', { headers: { Authorization: `Bearer ${await getToken()} ` } })
            if (data.success) {
                setBookings(data.bookings)
            }
        } catch (error) {
            console.log(error)
        }
        setIsLoading(false)
    }
    
    const handlePayNow = async (e, bookingId) => {
        e.preventDefault()
        e.stopPropagation()
        setProcessingPaymentId(bookingId)
        try {
            const { data } = await axios.post(
                '/api/booking/regenerate-payment-link',
                { bookingId },
                { headers: { Authorization: `Bearer ${await getToken()}` } }
            )
            if (data.success && data.url) {
                // Open the payment link in a new window
                window.open(data.url, '_blank', 'noopener,noreferrer')
                // Refresh bookings to get updated payment link
                await getMyBookings()
            } else {
                alert(data.message || 'Failed to generate payment link')
            }
        } catch (error) {
            console.error('Error regenerating payment link:', error)
            alert(error.response?.data?.message || 'Failed to generate payment link. Please try again.')
        } finally {
            setProcessingPaymentId(null)
        }
    }
    
    useEffect(() => {
        if (user) {
            getMyBookings();
        }
    }, [user])
    return !isLoading ? (
        <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
            <BlurCircle top="100px" left="100px" />
            <div>
                <BlurCircle bottom="0px" left="600px" />
            </div>
            <h1 className="text-lg font-semibold mb-4">My Bookings</h1>
            {bookings.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl">
                    <div className="flex flex-col md:flex-row">
                        <img src={image_base_url + item.show.movie.poster_path} alt="" className="md:max-w-45 aspect-video h-auto object-cover object-bottom rounded" />
                        <div className="flex flex-col p-4">
                            <p className="text-lg font-semibold">{item.show.movie.title}</p>
                            <p className="text-gray-400 text-sm ">{timeFormat(item.show.movie.runtime)}</p>
                            <p className="text-gray-400 text-sm mt-auto">{dateFormat(item.show.showDateTime)}</p>
                        </div>
                    </div>
                    <div className="flex flex-col md:items-end md:text-right justify-between p-4">
                        <div className="flex items-center gap-4">
                            <p className="text-2xl font-semibold mb-3">{currency}{item.amount}</p>
                            {!item.isPaid && (
                                <button
                                    onClick={(e) => handlePayNow(e, item._id)}
                                    disabled={processingPaymentId !== null}
                                    className="bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processingPaymentId === item._id ? 'Processing...' : 'Pay Now'}
                                </button>
                            )}
                        </div>
                        <div className="text-sm">
                            <p><span className="text-gray-400">Total Tickets:</span>{item.bookedSeats.length}</p>
                            <p><span className="text-gray-400">Seat Number:</span>{item.bookedSeats.join(", ")}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    ) : (
        <Loading />
    )
};
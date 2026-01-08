import React, { useEffect, useState } from "react";
import { Loading } from "../../components/Loading";
import { Title } from "../../components/admin/Title";
import { StarIcon, CheckIcon, DeleteIcon } from "lucide-react";
import { kConverter } from "../../lib/kConverter";
import { useAppContext } from "../../context/Appcontext";
import toast from "react-hot-toast";
export const AddShows = () => {
    const { axios, getToken, user, image_base_url } = useAppContext()
    const currency = import.meta.env.VITE_CURRENCY
    const [nowPlayMovies, setNowPlayMovies] = useState([]);
    const [selectMovie, setSelectMovie] = useState(null);
    const [dateTimeSelection, setDateTimeSelection] = useState({});
    const [dateTimeInput, setDateTimeInput] = useState("");
    const [showPrice, setShowPrice] = useState("");
    const [addingShow, setAddingShow] = useState(false);
    const fetchNowPlayingMovies = async () => {
        try {
            const { data } = await axios.get('/api/show/now-playing', { 
                headers: { Authorization: `Bearer ${await getToken()}` },
                timeout: 30000
            })
            if (data.success) {
                setNowPlayMovies(data.movies || [])
            } else {
                console.error('Failed to fetch movies:', data.message);
                toast.error(data.message || 'Failed to fetch movies. Please try again.');
                setNowPlayMovies([]);
            }
        } catch (error) {
            console.error('Error fetching movies:', error);
            toast.error('Network error: Unable to fetch movies. Please check your connection and try again.');
            setNowPlayMovies([]);
        }
    };
    const handleDateTimeAdd = () => {
        if (!dateTimeInput) return;
        const [date, time] = dateTimeInput.split("T");
        if (!date || !time) return;
        setDateTimeSelection((prev) => {
            const times = prev[date] || [];
            if (!times.includes(time)) {
                return { ...prev, [date]: [...times, time] };
            }
            return prev;
        });
    };
    const handleRemoveTime = (date, time) => {
        setDateTimeSelection((prev) => {
            const filteredTimes = prev[date].filter((t) => t !== time);
            if (filteredTimes.length === 0) {
                const { [date]: _, ...rest } = prev;
                return rest;
            }
            return {
                ...prev, 
                [date]: filteredTimes,
            };
        });
    };
    const handleSubmit = async () => {
        try {
            setAddingShow(true)
            if (!selectMovie || Object.keys(dateTimeSelection).length === 0 || !showPrice) {
                toast.error('Missing fields: Please select a movie, add date/time, and set price');
                setAddingShow(false);
                return;
            }
            const showsInput = Object.entries(dateTimeSelection).map(([date, time]) => ({ date, time }));
            console.log('Submitting shows:', { movieId: selectMovie, showsInput, showPrice: Number(showPrice) });
            const payload = {
                movieId: selectMovie,
                showsInput,
                showPrice: Number(showPrice)
            }
            const { data } = await axios.post('/api/show/add', payload, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                toast.success(data.message)
                setSelectMovie(null)
                setDateTimeSelection({})
                setShowPrice("")
                setDateTimeInput("")
            }
            else {
                toast.error(data.message || 'Failed to add show')
            }
        } catch (error) {
            console.error("Submission error:", error);
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred. Please try again.';
            toast.error(errorMessage);
        } finally {
            setAddingShow(false)
        }
    }
    useEffect(() => {
        if (user) {
            fetchNowPlayingMovies();
        }
    }, [user]);
    if (nowPlayMovies.length === 0 && user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Title text1="Add" text2="Shows" />
                <p className="mt-10 text-lg font-medium text-gray-400">No movies available</p>
                <p className="mt-2 text-sm text-gray-500">Unable to fetch now playing movies. Please check your connection and try again.</p>
                <button 
                    onClick={fetchNowPlayingMovies} 
                    className="mt-4 bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 transition-all cursor-pointer"
                >
                    Retry
                </button>
            </div>
        );
    }

    return nowPlayMovies.length > 0 ? (
        <>
            <Title text1="Add" text2="Shows" />
            <p className="mt-10 text-lg font-medium">Now Playing Movies</p>
            <div className="overflow-x-auto pb-4">
                <div className="group flex flex-wrap gap-4 mt-4 w-max">
                    {nowPlayMovies.map((movie) => (
                        <div key={movie.id} className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300`} onClick={() => setSelectMovie(movie.id)}>
                            <div className="relative rounded-lg overflow-hidden">
                                <img src={image_base_url + movie.poster_path} alt="" className="w-full object-cover brightness-90" />
                                <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                                    <p className="flex items-center gap-1 text-gray-400">
                                        <StarIcon className="w-4 h-4 text-primary fill-primary" />
                                        {movie.vote_average.toFixed(1)}
                                    </p>
                                    <p className="text-gray-300">{kConverter(movie.vote_count)}Votes</p>
                                </div>
                            </div>
                            {selectMovie === movie.id && (
                                <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded">
                                    <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                                </div>
                            )}
                            <p className="font-medium truncate">{movie.title}</p>
                            <p className="text-gray-400 text-sm">{movie.release_date}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-8">
                <label className="block text-sm font-medium mb-2">Show Price</label>
                <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md">
                    <p className="text-gray-400 text-sm">{currency}</p>
                    <input min={0} type="number" value={showPrice} onChange={(e) => setShowPrice(e.target.value)} placeholder="Enter show price" className="outline-none" />
                </div>
            </div>
            <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Show Date & Time</label>
                <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg">
                    <input type="datetime-local" value={dateTimeInput} onChange={(e) => setDateTimeInput(e.target.value)} className="outline-none rounded-md" />
                    <button onClick={handleDateTimeAdd} className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer">Add Time</button>
                </div>
            </div>
            {Object.keys(dateTimeSelection).length > 0 && (
                <div className="mt-6">
                    <h2 className="mb-2">Selected Date-Time</h2>
                    <ul className="space-y-3">
                        {Object.entries(dateTimeSelection).map(([date, times]) => (
                            <li key={date}>
                                <div className="font-medium">{date}</div>
                                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                                    {times.map((time) => (
                                        <div key={time} className="border border-primary px-2 py-1 flex items-center rounded">
                                            <span>{time}</span>
                                            <DeleteIcon onClick={() => handleRemoveTime(date, time)} width={15} className="ml-2 text-red-500 hover:text-red-700 cursor-pointer" />
                                        </div>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <button onClick={handleSubmit} disabled={addingShow} className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer">Add Show</button>
        </>
    ) : <Loading />
} 
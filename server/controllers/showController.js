import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";

// Create axios instance with timeout and retry configuration
const tmdbAxios = axios.create({
    timeout: 30000, // 30 second timeout
    headers: {
        'Accept': 'application/json',
    }
});

//API to get now Playing movies from TMDB API
export const getNowPlayingMovies = async (req, res) => {
    try {
        const { data } = await tmdbAxios.get('https://api.themoviedb.org/3/movie/now_playing', {
            headers: { 
                Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
                'Accept': 'application/json'
            },
            timeout: 30000,
        })
        const movies = data.results || [];
        res.json({ success: true, movies: movies })
    } catch (error) {
        console.error('Error fetching now playing movies:', error.message);
        console.error('Error code:', error.code);
        console.error('Error response:', error.response?.data);
        
        // Return empty array instead of failing completely
        res.json({ 
            success: false, 
            message: error.response?.data?.status_message || error.message || 'Failed to fetch movies from TMDB',
            movies: [] // Return empty array so frontend doesn't break
        })
    }
}

// API to add a new show to the database
export const addShow = async (req, res) => {
    try {
        const { movieId, showsInput, showPrice } = req.body
        
        // Validate input
        if (!movieId || !showsInput || !showPrice) {
            return res.json({ success: false, message: 'Missing required fields: movieId, showsInput, or showPrice' });
        }
        
        if (!Array.isArray(showsInput) || showsInput.length === 0) {
            return res.json({ success: false, message: 'showsInput must be a non-empty array' });
        }
        
        let movie = await Movie.findById(movieId)
        if (!movie) {
            //Fetch movie details from TMDB
            const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                tmdbAxios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                    headers: { 
                        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
                        'Accept': 'application/json'
                    },
                    timeout: 30000,
                }),
                tmdbAxios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                    headers: { 
                        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
                        'Accept': 'application/json'
                    },
                    timeout: 30000,
                })
            ]);
            const movieApiData = movieDetailsResponse.data;
            const movieCreditsData = movieCreditsResponse.data;
            const movieDetails = {
                _id: movieId,
                title: movieApiData.title,
                overview: movieApiData.overview,
                poster_path: movieApiData.poster_path,
                backdrop_path: movieApiData.backdrop_path,
                genres: movieApiData.genres,
                casts: movieCreditsData.cast,
                release_date: movieApiData.release_date,
                original_language: movieApiData.original_language,
                tagline: movieApiData.tagline || "",
                vote_average: movieApiData.vote_average,
                runtime: movieApiData.runtime
            }

            //Add movie to the database
            movie = await Movie.create(movieDetails);
        }
        const showsToCreate = [];
        showsInput.forEach(show => {
            const showDate = show.date;
            if (!showDate || !show.time) {
                console.error('Invalid show data:', show);
                return;
            }
            if (!Array.isArray(show.time)) {
                console.error('show.time must be an array:', show);
                return;
            }
            show.time.forEach((time) => {
                if (!time) return;
                const dateTimeString = `${showDate}T${time}`;
                const showDateTime = new Date(dateTimeString);
                if (isNaN(showDateTime.getTime())) {
                    console.error('Invalid date time string:', dateTimeString);
                    return;
                }
                showsToCreate.push({
                    movie: movieId,
                    showDateTime,
                    showPrice: Number(showPrice),
                    occupiedSeats: {}
                })
            })
        });
        if (showsToCreate.length > 0) {
            await Show.insertMany(showsToCreate);          
        }

    // Trigger Inngest event 
    await inngest.send({
    name:"app/show.added",
    data:{movieTitle:movie.title}
    })
        res.json({ success: true, message: 'Show Added successfully.' })
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//API to get all shows from the database
export const getShows = async (req, res) => {
    try {
        const shows = await Show.find({ }).populate('movie').sort({ showDateTime: 1 });

        // filter unique shows
        const uniqueShows = Array.from(new Set(shows.map(show => show.movie)));
        res.json({ success: true, shows: uniqueShows });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

//API to get single show from the database
export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;
        // get all upcoming shows for the movie
        const shows = await Show.find({ movie: movieId, showDateTime: { $gte: new Date() } });
        const movie = await Movie.findById(movieId);
        const dateTime = {};
        shows.forEach((show) => {
            const date = show.showDateTime.toISOString().split("T")[0];
            if (!dateTime[date]) {
                dateTime[date] = []
            }
            dateTime[date].push({ time: show.showDateTime, showId: show._id })
        })
        res.json({success:true,movie,dateTime});
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export const deleteShowsByMovie = async (req, res) => {
    try {
        const { movieId } = req.params;

        const result = await Show.deleteMany({ movie: movieId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No shows found for this movie ID." 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: `${result.deletedCount} shows deleted successfully.` 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
  
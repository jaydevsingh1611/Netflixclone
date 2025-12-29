import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

export const AppContext = createContext();
export const AppProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [shows, setShows] = useState([]);
    const [favoriteMovies, setFavoriteMovies] = useState([])
    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/original';

    const { user } = useUser();
    const { getToken } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const fetchIsAdmin = async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const { data } = await axios.get('/api/admin/is-admin', { headers: { Authorization: `Bearer ${token}` } })
            setIsAdmin(data.isAdmin)
            if (!data.isAdmin && location.pathname.startsWith('/admin')) {
                navigate('/')
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchShows = async () => {
        try {
            const {data} = await axios.get('/api/show/all',{headers:{Authorization:`Bearer ${await getToken()}`}})
            if (data.success) {
                setShows(data.shows)
            }
        } catch (error) {
            // Only log network errors if server is not running (development)
            if (error.code !== 'ERR_NETWORK') {
                console.error('Error fetching shows:', error);
            }
        }
    };
    const fetchFavoriteMovies = async () => {
        try {
            const {data} = await axios.get('/api/user/favorites',{headers:{Authorization:`Bearer ${await getToken()}`}})
            if (data.success) {
                setFavoriteMovies(data.movies)
            }
        } catch (error) {
            console.error(error);
        }
    }
    

    useEffect(() => {
        fetchShows();
    }, []);
    useEffect(() => {
        if (user) {
            fetchIsAdmin()
            fetchFavoriteMovies()
        }
    }, [user]);
    const value = { axios,fetchIsAdmin,user,getToken,navigate,isAdmin,shows,favoriteMovies,fetchFavoriteMovies,image_base_url}
    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
};

export const useAppContext = () => useContext(AppContext);
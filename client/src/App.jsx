import React from "react";
import {Favourite} from "./pages/Favourite";
import { Navbar } from "./components/Navbar";
import { Route,Routes,useLocation } from "react-router-dom";
import { Home } from "./pages/Home";
import { Movies } from "./pages/Movies";
import { SeatLayout } from "./pages/SeatLayout";
import { MyBookings } from "./pages/MyBooking";
import { Toaster } from "react-hot-toast";
import { Footer } from "./components/Footer";
import { MovieDetails } from "./pages/MovieDetails";
import { Dashboard } from "./pages/admin/Dashboard";
import { AddShows } from "./pages/admin/AddShows";
import { ListShows } from "./pages/admin/ListShows";
import { ListBookings } from "./pages/admin/ListBookings";
import { Layout } from "./pages/admin/Layout";
import { useAppContext } from "./context/Appcontext";
import { SignIn } from "@clerk/clerk-react";
import { Loading } from "./components/Loading";
const App = () => {
const isAdminRoute = useLocation().pathname.startsWith("/admin");

const { user } = useAppContext();
return (
<>
<Toaster/>
{!isAdminRoute && <Navbar/>}
<Routes>
<Route path  = "/" element={<Home/>} />
<Route path  = "/movies" element={<Movies/>} /> 
<Route path  = "/movies/:id" element={<MovieDetails/>} />
<Route path  = "/movies/:id/:date" element={<SeatLayout/>} /> 
<Route path  = "/my-bookings" element={<MyBookings/>} />
<Route path  = "/favourite" element={<Favourite/>} /> 
<Route path  = "/loading/:nextUrl" element={<Loading/>} /> 
<Route path="/admin/*" element={user ? <Layout/> : (
<div className="min-h-screen flex justify-center items-center">
<SignIn fallbackRedirectUrl={'/admin'}/>
</div>
)}>
<Route index element={<Dashboard/>}/>
<Route path="add-shows" element={<AddShows/>}/>
<Route path="list-shows" element={<ListShows/>}/>
<Route path="list-bookings" element={<ListBookings/>}/>
</Route>
</Routes>
{!isAdminRoute && <Footer/>}
</>
);
};
export default App;
import express from "express";
import { addShow, deleteShowsByMovie, getNowPlayingMovies, getShow, getShows } from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";

export const showRouter = express.Router();
showRouter.get('/now-playing', getNowPlayingMovies)
showRouter.post('/add', protectAdmin, addShow)
showRouter.get('/all', getShows)
showRouter.get("/:movieId", getShow)
showRouter.delete("/movie/:movieId", deleteShowsByMovie);







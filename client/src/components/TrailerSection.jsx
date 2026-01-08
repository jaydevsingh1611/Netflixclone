import React, { useState, useEffect, Suspense } from "react";
import { dummyTrailers } from "../../assets/assets";
import { BlurCircle } from "./BlurCircle";
import { Play, Bookmark, Share2, PlayCircleIcon } from "lucide-react";
import toast from "react-hot-toast";

const ReactPlayer = React.lazy(() => import("react-player"));

export const TrailerSection = () => {
const[currentTrailer,setCurrentTrailer] = useState(null)
const[isPlaying, setIsPlaying] = useState(false)

useEffect(() => {
    if (dummyTrailers && dummyTrailers.length > 0) {
        setCurrentTrailer(dummyTrailers[0])
        console.log("Trailer data:", dummyTrailers[0])
    }
}, [])

if (!currentTrailer || !currentTrailer.videoUrl) {
    return null;
}

// Extract YouTube video ID from URL
const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const videoId = getYouTubeId(currentTrailer.videoUrl);
const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1`;

const handleWatchLater = (e) => {
    e.stopPropagation();
    toast.success("Added to Watch Later");
    // Add your watch later logic here
};

const handleShare = async (e) => {
    e.stopPropagation();
    try {
        if (navigator.share) {
            await navigator.share({
                title: 'Trailer',
                text: 'Check out this trailer!',
                url: currentTrailer.videoUrl,
            });
        } else {
            // Fallback: Copy to clipboard
            await navigator.clipboard.writeText(currentTrailer.videoUrl);
            toast.success("Link copied to clipboard!");
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            // Fallback: Copy to clipboard
            await navigator.clipboard.writeText(currentTrailer.videoUrl);
            toast.success("Link copied to clipboard!");
        }
    }
};

return(
<div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
<p className="text-gray-300 font-medium text-lg max-w-[960px] mx-auto">Trailers</p>
<div className="relative mt-6 max-w-[960px] mx-auto">
<BlurCircle top="-100px" right="-100px"/>
<div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
{/* Watch Later and Share buttons - top right */}
<div className="absolute top-4 right-4 z-30 flex items-center gap-2">
    <button
        onClick={handleWatchLater}
        className="p-2.5 bg-black/70 hover:bg-black/90 backdrop-blur-sm rounded-full transition-all hover:scale-110 cursor-pointer"
        title="Watch Later"
    >
        <Bookmark className="w-5 h-5 text-white" />
    </button>
    <button
        onClick={handleShare}
        className="p-2.5 bg-black/70 hover:bg-black/90 backdrop-blur-sm rounded-full transition-all hover:scale-110 cursor-pointer"
        title="Share"
    >
        <Share2 className="w-5 h-5 text-white" />
    </button>
</div>
{/* Thumbnail image - always visible when not playing */}
{!isPlaying && (
    <div 
        className="absolute top-0 left-0 w-full h-full cursor-pointer group z-20 bg-black"
        onClick={() => setIsPlaying(true)}
    >
        {currentTrailer.image && (
            <img 
                src={currentTrailer.image} 
                alt="Trailer thumbnail" 
                className="w-full h-full object-cover"
                style={{ 
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                }}
                onError={(e) => {
                    console.error("Failed to load thumbnail image:", currentTrailer.image);
                    e.target.style.display = 'none';
                }}
            />
        )}
        {/* Centered play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl pointer-events-auto cursor-pointer">
                <Play className="w-12 h-12 text-black ml-1" fill="black" />
            </div>
        </div>
    </div>
)}
{/* Video player - shown when playing */}
{isPlaying && videoId && (
    <iframe
        className="absolute top-0 left-0 w-full h-full z-10"
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
    />
)}
{isPlaying && !videoId && (
    <Suspense fallback={<div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white z-10">Loading player...</div>}>
        <div className="absolute top-0 left-0 w-full h-full z-10">
            <ReactPlayer 
                url={currentTrailer.videoUrl} 
                playing={true}
                controls={true}
                width="100%"
                height="100%"
                config={{
                    youtube: {
                        playerVars: { 
                            autoplay: 1,
                            modestbranding: 1,
                            rel: 0
                        }
                    }
                }}
            />
        </div>
    </Suspense>
)}
</div>
</div>
{/* Trailer grid - below main trailer */}
<div className="group grid grid-cols-4 gap-4 md:gap-8 mt-8 max-w-3xl mx-auto">
{dummyTrailers.map((trailer) => (
    <div 
        key={trailer.image} 
        className="relative group-hover:not-hover:opacity-50 hover:-translate-y-1 duration-300 transition max-md:h-60 cursor-pointer" 
        onClick={() => {
            setCurrentTrailer(trailer);
            setIsPlaying(false);
        }}
    >
        <img 
            src={trailer.image} 
            alt="trailer" 
            className="rounded-lg w-full h-full object-cover brightness-75"
        />
        <PlayCircleIcon 
            strokeWidth={1.6} 
            className="absolute top-1/2 left-1/2 w-5 md:w-8 h-5 md:h-12 transform -translate-x-1/2 -translate-y-1/2 text-white"
        />
    </div>
))}
</div>
</div>
)
}
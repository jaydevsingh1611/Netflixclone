import React from "react";
export const  BlurCircle  = ({ top, left, right, bottom }) => {
    return(
        <div className="absolute -z-50 aspect-square w-[58px] rounded-full bg-primary/30 blur-3xl" style = {{top:top,left:left,right:right,bottom:bottom}}>  
        </div>
    );
};
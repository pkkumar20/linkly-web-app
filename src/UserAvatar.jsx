import React from 'react';

const Avatar = React.memo(({
    size = "w-12 h-12",
    textSize = "text-lg",
    image,
    emoji,
    emojiSize,
    text,
    bgFrom = "#1f4037",
    bgTo = "#99f2c8",
    simpleBg , // solid bg override
}) => {
  
    // Compose gradient classes safely by using fixed class names and inline styles for colors if needed
    const gradientClass = simpleBg ? "" : "bg-gradient-to-tr";

    // Use inline styles for arbitrary colors to ensure they apply
    const bgStyle = simpleBg
        ? { backgroundColor: simpleBg }
        : { backgroundImage: `linear-gradient(to top right, ${bgFrom}, ${bgTo})` };

    return (
        <div
            className={`select-none flex items-center justify-center rounded-full overflow-hidden ${size} ${simpleBg ? simpleBg : gradientClass
                }`}
            style={bgStyle}
        >
            {image ? (
                <img src={image} alt="avatar" className="object-cover w-full h-full" />
            ) : emoji ? (
                <span className={`w-full h-full flex items-center justify-center ${emojiSize || 'text-2xl'}`} style={{ lineHeight: 1 }}>{emoji}</span>
            ) : text ? (
                <span className={`w-full h-full flex items-center justify-center font-semibold text-white ${textSize}`} style={{ lineHeight: 1 }}>{text}</span>
            ) : (
                <span className="w-full h-full flex items-center justify-center text-2xl text-white" style={{ lineHeight: 1 }}>🙂</span>
            )}
        </div>
    );
});
export default Avatar;
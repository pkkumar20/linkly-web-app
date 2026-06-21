// Avatar.jsx
const Avatar = ({
    size = "w-12 h-12",
    image,      // Pass image URL for user photo
    emoji,      // Pass emoji string e.g. "😄"
    text,       // Pass initials or display name e.g. "AB"
    bgFrom = "#1f4037",
    bgTo = "#99f2c8", 
    simpleBg,   // Override for solid background e.g. "bg-blue-500"
}) => {
    const gradientClass = simpleBg ? "" : "bg-gradient-to-tr";

    // Use inline styles for arbitrary colors to ensure they apply
    const bgStyle = simpleBg
        ? { backgroundColor: simpleBg }
        : { backgroundImage: `linear-gradient(to top right, ${bgFrom}, ${bgTo})` };
    return (
        <div
            className={`select-none flex items-center justify-center rounded-full shrink-0 overflow-hidden lg:ml-2
            w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px]
            ${simpleBg ? simpleBg : gradientClass}`}
            style={bgStyle}
        >
            {image ? (
                <img
                    src={image}
                    alt="avatar"
                    className="object-cover w-full h-full"
                />
            ) : emoji ? (
                <span className="text-[26px] sm:text-2xl leading-none flex items-center justify-center h-full relative" style={{ top: "1px" }}>{emoji}</span>
            ) : text ? (
                <span className="font-semibold text-white text-lg leading-none flex items-center justify-center h-full relative" style={{ top: "1px" }}>{text}</span>
            ) : (
                <span className="text-2xl text-white leading-none flex items-center justify-center h-full relative" style={{ top: "1px" }}>🙂</span> // Default emoji fallback
            )}
        </div>
    );
};

export default Avatar;

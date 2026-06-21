import React from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";

export default function Test2({ images }) {
    return (
        <ResponsiveMasonry
            columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }} // Adjust columns based on width
        >
            <Masonry gutter="10px"> // Spacing between items
                {images.map((item, i) => (
                    <img
                        key={i}
                        src={item.url}
                        style={{
                            width: "100%",
                            display: "block",
                            borderRadius: "10px", // Rounded corners like Telegram
                            objectFit: "cover"
                        }}
                        alt="Masonry Item"
                    />
                ))}
            </Masonry>
        </ResponsiveMasonry>
    );
};
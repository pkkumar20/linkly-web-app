import React, { useState, useMemo, useEffect, useRef } from "react";
import { mappls } from "mappls-web-maps";
import { MdLocationOn, MdOpenInNew } from "react-icons/md";
import LocationViewer from "./LocationViewer";

const MAPPLS_TOKEN = import.meta.env.VITE_MAPPLS_TOKEN;

const LocationMessage = ({ msg, isSent, formattedTime, hasOtherIds, timeBlock }) => {
    const [mapError, setMapError] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    
    const mapId = useMemo(() => `map-msg-${msg._id || Math.random().toString(36).substring(2, 9)}`, [msg._id]);
    const mapRef = useRef(null);

    const coords = useMemo(() => {
        const loc = msg.locationDetails;
        if (!loc || !loc.coordinates || loc.coordinates.length < 2) return null;
        return { longitude: loc.coordinates[0], latitude: loc.coordinates[1] };
    }, [msg.locationDetails]);

    useEffect(() => {
        if (!coords || !MAPPLS_TOKEN) return;

        let isMounted = true;
        const mapplsClassObject = new mappls();

        try {
            mapplsClassObject.initialize(MAPPLS_TOKEN, { map: true }, () => {
                if (!isMounted) return;
                
                try {
                    const newMap = mapplsClassObject.Map({
                        id: mapId,
                        properties: {
                            center: [coords.latitude, coords.longitude],
                            zoom: 14,
                            interactive: false,
                            scrollZoom: false,
                            boxZoom: false,
                            dragRotate: false,
                            dragPan: false,
                            keyboard: false,
                            doubleClickZoom: false,
                            touchZoomRotate: false,
                            zoomControl: false,
                            clickableIcons: false,
                            searchControl: false,
                            location: false,
                            fullscreenControl: false
                        },
                    });

                    newMap.on("load", () => {
                        if (!isMounted) return;
                        mapplsClassObject.Marker({
                            map: newMap,
                            position: { lat: coords.latitude, lng: coords.longitude },
                            width: 32,
                            height: 32,
                            html: `<div class="location-marker-pin"><div class="location-marker-pin-inner"></div></div>`
                        });
                    });
                    
                    newMap.on("error", () => {
                        if (isMounted) setMapError(true);
                    });

                    mapRef.current = newMap;
                } catch (e) {
                    console.error("Map initialization error:", e);
                    if (isMounted) setMapError(true);
                }
            });
        } catch (e) {
            console.error("Mappls token or SDK error:", e);
            if (isMounted) setMapError(true);
        }

        return () => {
            isMounted = false;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [coords, mapId]);

    if (!coords) return null;

    const addressText = msg.content || "";

    const handleOpenMap = (e) => {
        e.stopPropagation();
        setViewerOpen(true);
    };

    return (
        <div className="location-message-container">
            {/* Map Preview */}
            <div
                className="location-map-preview"
                onClick={handleOpenMap}
                style={{ cursor: "pointer" }}
            >
                {MAPPLS_TOKEN && !mapError ? (
                    <div id={mapId} style={{ width: "100%", height: "100%", pointerEvents: "none" }} className="mappls-preview-container" />
                ) : (
                    /* Static fallback when no token or map error */
                    <div className="location-map-fallback">
                        <MdLocationOn size={48} className="text-[#8763ea]" />
                        <span className="text-sm text-gray-500 mt-1">Map preview unavailable</span>
                    </div>
                )}

                {/* Hover overlay */}
                <div className="location-map-overlay">
                    <MdOpenInNew size={20} className="text-white" />
                    <span className="text-white text-xs font-medium">View Location</span>
                </div>
            </div>

            {/* Address & time row */}
            <div className="location-info-row">
                <div className="location-info-left">
                    <div className="location-icon-wrapper" style={{ backgroundColor: isSent ? "#dcfce7" : "#f3f4f6" }}>
                        <MdLocationOn size={18} className="text-[#8763ea]" />
                    </div>
                    <div className="location-text-col">
                        <span className="location-label">Location</span>
                        {addressText && (
                            <span className="location-address">{addressText}</span>
                        )}
                    </div>
                </div>
                {timeBlock}
            </div>

            <style>{`
                .location-message-container {
                    width: 260px;
                    overflow: hidden;
                }
                .location-map-preview {
                    position: relative;
                    width: 100%;
                    height: 160px;
                    overflow: hidden;
                    background: #f3f4f6;
                }
                .mappls-preview-container .mapboxgl-canvas {
                    border-radius: 0;
                }
                /* Shrink and position the Mappls logo in the small preview */
                .mappls-preview-container img, 
                .mappls-preview-container .mapboxgl-ctrl-bottom-left {
                    transform: scale(0.4);
                    transform-origin: bottom left;
                    opacity: 0.7;
                    max-width: 150px !important;
                }
                .mappls-preview-container .mapboxgl-ctrl-bottom-right {
                    display: none !important;
                }
                .location-map-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.0);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    opacity: 0;
                    transition: all 0.2s ease;
                    pointer-events: none;
                }
                .location-map-preview:hover .location-map-overlay {
                    opacity: 1;
                    background: rgba(0,0,0,0.35);
                }
                .location-map-fallback {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: #f9fafb;
                }
                .location-marker-pin {
                    width: 32px;
                    height: 32px;
                    background: #8763ea;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(135, 99, 234, 0.4);
                    border: 2px solid white;
                }
                .location-marker-pin-inner {
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-radius: 50%;
                    transform: rotate(45deg);
                }
                .location-info-row {
                    display: flex;
                    align-items: flex-end;
                    padding: 8px 12px 8px 10px;
                    gap: 8px;
                }
                .location-info-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                    min-width: 0;
                }
                .location-icon-wrapper {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .location-text-col {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                .location-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #1f2937;
                    line-height: 1.2;
                }
                .location-address {
                    font-size: 12px;
                    color: #6b7280;
                    line-height: 1.3;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 160px;
                }
            `}</style>
            
            {viewerOpen && (
                <LocationViewer msg={msg} onClose={() => setViewerOpen(false)} />
            )}
        </div>
    );
};

export default LocationMessage;

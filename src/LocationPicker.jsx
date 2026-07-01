import React, { useState, useEffect, useRef } from 'react';
import { mappls } from "mappls-web-maps";
import { MdMyLocation, MdSend, MdSearch, MdClose, MdLocationOff } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

const LocationPicker = ({ onClose, onSend }) => {
    const MAPPLS_TOKEN = import.meta.env.VITE_MAPPLS_TOKEN;
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

    const [viewState, setViewState] = useState({
        longitude: 77.2090,
        latitude: 28.6139,
        zoom: 12
    });
    const [marker, setMarker] = useState({ latitude: 28.6139, longitude: 77.2090 });
    const [currentCoords, setCurrentCoords] = useState(null); // Track actual GPS coordinates
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // States for permission and search tracking
    const [permissionStatus, setPermissionStatus] = useState('pending');
    const [hasSearched, setHasSearched] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isLocationResolved, setIsLocationResolved] = useState(false);

    const mapRef = useRef(null);
    const mapObjRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                if (result.state === 'granted') {
                    setPermissionStatus('granted');
                    getCurrentLocation(false, true); // Block map render until we have the coords
                } else {
                    if (result.state === 'denied') setPermissionStatus('denied');
                    setIsLocationResolved(true); // Render map immediately with default coords
                    
                    // Trigger prompt if it's 'prompt'
                    if (result.state !== 'denied') {
                        getCurrentLocation(true, false);
                    }
                }
            });
        } else {
            setIsLocationResolved(true);
            getCurrentLocation(true, false);
        }
    }, []);

    const getCurrentLocation = (isInit = false, blockRender = false) => {
        if (isInit) setPermissionStatus('pending');
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                setCurrentCoords({ latitude, longitude });
                updateMapCenter(latitude, longitude, 15);
                setPermissionStatus('granted');
                setHasSearched(false);
                if (blockRender) setIsLocationResolved(true);
            }, (error) => {
                console.error("Error getting location:", error);
                if (error.code === error.PERMISSION_DENIED || error.code === error.POSITION_UNAVAILABLE) {
                    setPermissionStatus('denied');
                }
                if (blockRender) setIsLocationResolved(true);
            });
        } else {
            setPermissionStatus('denied');
            if (blockRender) setIsLocationResolved(true);
        }
    };

    // Helper to update state and sync map
    const updateMapCenter = (latitude, longitude, zoom = 15) => {
        setViewState({ latitude, longitude, zoom });
        setMarker({ latitude, longitude });
        
        if (mapRef.current) {
            mapRef.current.setCenter({ lat: latitude, lng: longitude });
            mapRef.current.setZoom(zoom);
        }
        if (markerRef.current) {
            markerRef.current.setPosition({ lat: latitude, lng: longitude });
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim() || !MAPPLS_TOKEN) return;

        setIsSearching(true);
        try {
            const res = await fetch(`${SERVER_URL}/api/mappls-search?query=${encodeURIComponent(searchQuery)}&token=${MAPPLS_TOKEN}`);
            const data = await res.json();
            const locations = data.suggestedLocations || data.copResults || data.features || [];
            setSearchResults(locations);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    // Directly select the location when clicked without opening any popups
    const handleSelectResult = (place) => {
        const lat = parseFloat(place.latitude || place.lat);
        const lng = parseFloat(place.longitude || place.lng || place.lon);
        if (!isNaN(lat) && !isNaN(lng)) {
            updateMapCenter(lat, lng, 15);
        }
        setSearchResults([]);
        setSearchQuery(place.placeName || place.placeAddress || place.place_name || searchQuery);
        setHasSearched(true);
    };

    const isLocationDifferent = () => {
        if (!currentCoords || !marker) return true;
        const latDiff = Math.abs(marker.latitude - currentCoords.latitude);
        const lngDiff = Math.abs(marker.longitude - currentCoords.longitude);
        return latDiff > 0.0003 || lngDiff > 0.0003 || hasSearched;
    };

    const handleSend = async () => {
        if (marker) {
            setIsSending(true);
            let finalAddress = searchQuery;
            
            try {
                const res = await fetch(`${SERVER_URL}/api/mappls-revgeocode?lat=${marker.latitude}&lng=${marker.longitude}&token=${MAPPLS_TOKEN}`);
                const data = await res.json();
                if (data && data.address) {
                    finalAddress = data.address;
                }
            } catch (err) {
                console.error("Reverse geocoding failed", err);
            } finally {
                setIsSending(false);
            }

            if (!finalAddress || finalAddress.trim() === '') {
                finalAddress = `Location (${marker.latitude.toFixed(4)}, ${marker.longitude.toFixed(4)})`;
            }

            onSend({
                latitude: marker.latitude,
                longitude: marker.longitude,
                address: finalAddress
            });
        }
    };

    const mapVisible = isLocationResolved;

    // Initialize MapmyIndia Map
    useEffect(() => {
        if (!MAPPLS_TOKEN || !mapVisible) return;
        
        let isMounted = true;
        const mapplsClassObject = new mappls();
        mapObjRef.current = mapplsClassObject;
        
        try {
            mapplsClassObject.initialize(MAPPLS_TOKEN, { map: true }, () => {
                if (!isMounted) return;
                try {
                    const map = mapplsClassObject.Map({
                        id: "mappls-picker-map",
                        properties: {
                            center: [viewState.latitude, viewState.longitude],
                            zoom: viewState.zoom,
                            zoomControl: false,
                            fullscreenControl: false,
                            search: false,
                            location: false,
                            clickableIcons: false,
                            poi: false,
                            infoWindow: false,
                            popups: false,
                            popup: false
                        }
                    });
                    
                    if (map && typeof map.on === 'function') {
                        map.on("styleimagemissing", (e) => {
                            if (map && typeof map.hasImage === 'function' && !map.hasImage(e.id)) {
                                map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
                            }
                        });
                    }

                    map.on("load", () => {
                        if (!isMounted) return;
                        mapRef.current = map;
                        
                        // Add marker
                        markerRef.current = mapplsClassObject.Marker({
                            map: map,
                            position: { lat: viewState.latitude, lng: viewState.longitude },
                            html: `<div style="width: 40px; height: 40px; background: #8763ea; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(135, 99, 234, 0.4); border: 3px solid white; cursor: pointer; transform-origin: bottom left;"><div style="width: 14px; height: 14px; background: white; border-radius: 50%; transform: rotate(45deg);"></div></div>`,
                            width: 40,
                            height: 40,
                            offset: [0, -40]
                        });
                        
                        map.on("click", (e) => {
                            const lat = e.lngLat.lat;
                            const lng = e.lngLat.lng;
                            setMarker({ latitude: lat, longitude: lng });
                            setHasSearched(true);
                            if (markerRef.current) {
                                markerRef.current.setPosition({ lat, lng });
                            }
                        });
                    });
                } catch(e) {
                    console.error("Mappls Map Init Error:", e);
                }
            });
        } catch(e) {
            console.error("Mappls SDK Error:", e);
        }
        
        return () => {
            isMounted = false;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [mapVisible]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <style>{`
                /* Hide zoom, 3d, and fullscreen controls */
                .picker-map-container .mapboxgl-ctrl-top-right,
                .picker-map-container .mapboxgl-ctrl-top-left,
                .picker-map-container .mapboxgl-ctrl-bottom-right {
                    display: none !important;
                }
                /* Shrink Mappls logo */
                .picker-map-container img,
                .picker-map-container .mapboxgl-ctrl-bottom-left {
                    transform: scale(0.6);
                    transform-origin: bottom left;
                    opacity: 0.8;
                }
                /* Disable all Mappls/Mapbox default native POI popups and info windows */
                .picker-map-container .mapboxgl-popup,
                .picker-map-container .mappls-popup,
                .picker-map-container .mapmyindia-popup,
                .picker-map-container .info-window,
                .picker-map-container [class*="popup"],
                .picker-map-container [class*="infoWindow"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
            `}</style>
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col relative"
                style={{ height: '80vh' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 z-20 bg-white">
                    <h3 className="font-semibold text-lg">Send Location</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition">
                        <MdClose size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Content Area (Search + Map) */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-gray-50">

                    {/* Search Bar Container */}
                    <div className={`absolute inset-0 z-20 pointer-events-none p-4 ${mapVisible ? '' : 'bg-white'} overflow-hidden`}>
                        <motion.div
                            className="w-full max-w-md mx-auto pointer-events-auto relative"
                            initial={false}
                            animate={{
                                y: mapVisible ? 0 : "30vh"
                            }}
                            transition={{ type: "spring", damping: 25, stiffness: 250 }}
                        >
                            <AnimatePresence>
                                {!mapVisible && permissionStatus === 'pending' && (
                                    <motion.div
                                        key="pending"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="text-center absolute bottom-full mb-6 left-0 right-0"
                                    >
                                        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 text-blue-500 rounded-full mb-4 shadow-sm relative">
                                            <MdMyLocation size={40} className="relative z-10 animate-pulse" />
                                            <div className="absolute inset-0 bg-blue-400 opacity-20 rounded-full animate-ping"></div>
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-800 mb-2">Allow Location Access</h4>
                                        <p className="text-gray-500">Please allow permission to show your current location, or search below.</p>
                                    </motion.div>
                                )}

                                {!mapVisible && permissionStatus === 'denied' && (
                                    <motion.div
                                        key="denied"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="text-center absolute bottom-full mb-6 left-0 right-0"
                                    >
                                        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 text-red-500 rounded-full mb-4 shadow-sm">
                                            <MdLocationOff size={40} />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-800 mb-2">Location Access Denied</h4>
                                        <p className="text-gray-500">Please search for a location manually.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className={`relative rounded-2xl bg-white transition-shadow duration-300 ${mapVisible ? 'shadow-lg border border-gray-100' : 'shadow-sm border border-gray-200'}`}>
                                <form onSubmit={handleSearch} className="flex items-center p-1">
                                    <div className="flex items-center justify-center pl-3 pr-2 text-gray-400">
                                        <MdSearch size={24} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search for a place or address..."
                                        className="flex-1 py-3.5 pr-4 bg-transparent border-none focus:ring-0 outline-none text-gray-800 placeholder-gray-400 text-base"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <div className="flex items-center justify-center w-12 h-12 mr-1 shrink-0">
                                        {isSearching ? (
                                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        ) : searchQuery ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setSearchResults([]);
                                                }}
                                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
                                            >
                                                <MdClose size={20} />
                                            </button>
                                        ) : null}
                                    </div>
                                </form>

                                {/* Search Results Dropdown */}
                                <AnimatePresence>
                                    {searchResults.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-72 overflow-y-auto overflow-x-hidden"
                                        >
                                            {searchResults.map((result, idx) => (
                                                <div
                                                    key={result.eLoc || result.id || idx}
                                                    onClick={() => handleSelectResult(result)}
                                                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                                >
                                                    <div className="mt-0.5 text-gray-400">
                                                        <MdSearch size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-[15px] text-gray-800 truncate">{result.placeName || result.text || result.place_name}</div>
                                                        <div className="text-[13px] text-gray-500 mt-0.5 truncate">{result.placeAddress || result.place_name}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>

                    {/* Map Area */}
                    <AnimatePresence>
                        {mapVisible && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0 z-10 picker-map-container"
                            >
                                {!MAPPLS_TOKEN && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100">
                                        <div className="text-center p-6 max-w-sm">
                                            <p className="text-red-500 font-semibold mb-2">Mappls token is missing!</p>
                                            <p className="text-sm text-gray-600">Please add VITE_MAPPLS_TOKEN to your .env file.</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div id="mappls-picker-map" style={{ width: '100%', height: '100%' }} />

                                {/* Current Location Button */}
                                {permissionStatus === 'granted' && (
                                    <button
                                        onClick={() => getCurrentLocation(false)}
                                        className="absolute bottom-6 right-4 p-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition border border-gray-100 text-blue-600 pointer-events-auto z-30"
                                        title="My Location"
                                    >
                                        <MdMyLocation size={24} />
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Action */}
                <AnimatePresence>
                    {mapVisible && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
                            className="p-4 border-t bg-white shrink-0 z-20"
                        >
                            <button
                                onClick={handleSend}
                                disabled={!marker || isSending}
                                className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-base font-bold transition-all duration-200
                                    ${marker && !isSending
                                        ? 'bg-[#8763ea] text-white shadow-lg shadow-[#8763ea]/30 hover:shadow-[#8763ea]/50 hover:-translate-y-0.5'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }
                                `}
                            >
                                {isSending ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <MdSend size={22} className={marker ? "animate-pulse" : ""} />
                                )}
                                {isSending ? "Getting Address..." : (permissionStatus === 'granted' && !isLocationDifferent()) ? "Send your current location" : "Send selected location"}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export default LocationPicker;

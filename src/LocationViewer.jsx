import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { mappls } from "mappls-web-maps";
import { MdClose, MdLocationOn, MdDirections, MdNavigation } from 'react-icons/md';
import toast from 'react-hot-toast';
import axios from 'axios';
const MAPPLS_TOKEN = import.meta.env.VITE_MAPPLS_TOKEN;

export default function LocationViewer({ msg, onClose }) {
    const coords = msg.locationDetails?.coordinates;
    const [longitude, latitude] = coords || [-122.4, 37.8];
    const [phase, setPhase] = useState('mounting');
    const isHistoryPushedRef = useRef(false);
    const [routesData, setRoutesData] = useState([]);
    const [activeRouteIndex, setActiveRouteIndex] = useState(0);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [userLoc, setUserLoc] = useState(null);

    const mapRef = useRef(null);
    const mapObjRef = useRef(null);
    const userMarkerRef = useRef(null);

    const formatDistance = (meters) => {
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
    };

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins} min`;
    };

    useEffect(() => {
        const raf = requestAnimationFrame(() => setPhase('open'));
        return () => cancelAnimationFrame(raf);
    }, []);

    // Push history state on mount for browser back button support
    useEffect(() => {
        if (!isHistoryPushedRef.current) {
            isHistoryPushedRef.current = true;
            window.history.pushState(
                { locationViewerOpen: true },
                '',
                window.location.pathname + window.location.hash + (window.location.href.includes('?') ? '&' : '?') + 'location=true'
            );
        }
    }, []);

    const triggerClose = useCallback(() => {
        if (phase === 'closing') return;
        setPhase('closing');
        // Pop history state if we pushed it
        if (isHistoryPushedRef.current) {
            isHistoryPushedRef.current = false;
            if (window.history.state?.locationViewerOpen) {
                window.history.back();
            }
        }
        setTimeout(onClose, 120);
    }, [phase, onClose]);

    // Listen for browser back button
    useEffect(() => {
        const handlePopState = (e) => {
            if (isHistoryPushedRef.current && !e.state?.locationViewerOpen) {
                isHistoryPushedRef.current = false;
                if (phase !== 'closing') {
                    setPhase('closing');
                    setTimeout(onClose, 120);
                }
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [onClose, phase]);

    // Cleanup history on unmount if still pushed
    useEffect(() => {
        return () => {
            if (isHistoryPushedRef.current && window.history.state?.locationViewerOpen) {
                isHistoryPushedRef.current = false;
                window.history.back();
            }
        };
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') triggerClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [triggerClose]);

    // Initialize map
    useEffect(() => {
        if (!MAPPLS_TOKEN) return;
        let isMounted = true;
        const mapplsClassObject = new mappls();
        mapObjRef.current = mapplsClassObject;

        try {
            mapplsClassObject.initialize(MAPPLS_TOKEN, { map: true }, () => {
                if (!isMounted) return;
                try {
                    const map = mapplsClassObject.Map({
                        id: "mappls-interactive-map",
                        properties: {
                            center: [latitude, longitude],
                            zoom: 14,
                            zoomControl: false,
                            clickableIcons: false
                        }
                    });

                    map.on("load", () => {
                        if (!isMounted) return;
                        mapRef.current = map;

                        // Add destination marker
                        mapplsClassObject.Marker({
                            map: map,
                            position: { lat: latitude, lng: longitude },
                            html: `<div style="width: 48px; height: 48px; background: #8763ea; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(135, 99, 234, 0.4); border: 4px solid white; cursor: pointer;"><div style="width: 16px; height: 16px; background: white; border-radius: 50%; transform: rotate(45deg);"></div></div>`,
                            width: 48,
                            height: 48,
                            offset: [0, -24] // anchor bottom equivalent
                        });
                    });
                } catch (e) {
                    console.error("Mappls Map Init Error:", e);
                }
            });
        } catch (e) {
            console.error("Mappls SDK Error:", e);
        }

        return () => {
            isMounted = false;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [latitude, longitude]);

    const drawRoutes = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;

        // Helper to safely remove layers/sources
        const removeSafe = (id) => {
            if (map.getLayer(id)) map.removeLayer(id);
        };
        const removeSourceSafe = (id) => {
            if (map.getSource(id)) map.removeSource(id);
        };

        // Remove existing routes up to 10 alternatives
        for (let i = 0; i < 10; i++) {
            removeSafe(`route-line-${i}`);
            removeSourceSafe(`route-${i}`);
        }
        removeSafe(`route-line-active`);
        removeSourceSafe(`route-active`);

        // Add alternative routes
        routesData.forEach((route, idx) => {
            if (idx === activeRouteIndex) return;
            map.addSource(`route-${idx}`, { type: "geojson", data: route.geometry });
            map.addLayer({
                id: `route-line-${idx}`,
                type: "line",
                source: `route-${idx}`,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#9ca3af', 'line-width': 4, 'line-opacity': 0.6 }
            });
        });

        // Add active route on top
        if (routesData[activeRouteIndex]) {
            map.addSource(`route-active`, { type: "geojson", data: routesData[activeRouteIndex].geometry });
            map.addLayer({
                id: `route-line-active`,
                type: "line",
                source: `route-active`,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#3b82f6', 'line-width': 6, 'line-opacity': 0.9 }
            });
        }
    }, [routesData, activeRouteIndex]);

    useEffect(() => {
        if (routesData.length > 0) {
            drawRoutes();
        }
    }, [drawRoutes, routesData]);

    const handleGoogleDirections = () => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, "_blank", "noopener,noreferrer");
    };

    const handleMapplsDirections = async () => {
        if (!MAPPLS_TOKEN) return toast.error("Mappls token is required.");

        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            if (permission.state === 'denied') {
                return toast.error("Please allow location to get directions.");
            }
        } catch (e) {
            // Safari might not support permissions.query for geolocation
        }

        setIsLoadingRoute(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { longitude: startLng, latitude: startLat } = pos.coords;
                setUserLoc({ longitude: startLng, latitude: startLat });

                if (mapRef.current && mapObjRef.current) {
                    if (userMarkerRef.current) {
                        userMarkerRef.current.remove();
                    }
                    userMarkerRef.current = mapObjRef.current.Marker({
                        map: mapRef.current,
                        position: { lat: startLat, lng: startLng },
                        html: `<div style="width: 24px; height: 24px; background: #3b82f6; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);"></div>`,
                        width: 24,
                        height: 24
                    });
                }

                try {
                    // We must use the backend proxy because route.mappls.com blocks browser requests (CORS)
                    const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
                    const res = await axios.get(`${SERVER_URL}/api/mappls-route`, {
                        params: {
                            startLng,
                            startLat,
                            endLng: longitude,
                            endLat: latitude,
                            token: MAPPLS_TOKEN
                        }
                    });
                    
                    const data = res.data;

                    if (data.routes && data.routes.length > 0) {
                        setRoutesData(data.routes);
                        setActiveRouteIndex(0);

                        if (mapRef.current) {
                            const minLng = Math.min(startLng, longitude);
                            const maxLng = Math.max(startLng, longitude);
                            const minLat = Math.min(startLat, latitude);
                            const maxLat = Math.max(startLat, latitude);
                            mapRef.current.fitBounds(
                                [[minLng, minLat], [maxLng, maxLat]],
                                { padding: 60, duration: 1500 }
                            );
                        }
                    } else {
                        toast.error(data.error || "Could not find a route.");
                    }
                } catch (err) {
                    console.error("Route fetch error:", err);
                    if (err.response) {
                        toast.error(`Backend Error: ${err.response.status} ${err.response.statusText}`);
                    } else {
                        toast.error(`Error: ${err.message}`);
                    }
                } finally {
                    setIsLoadingRoute(false);
                }
            },
            (err) => {
                console.error(err);
                if (err.code === 1) toast.error("Permission declined.");
                else if (err.code === 2) toast.error("Location information is unavailable.");
                else if (err.code === 3) toast.error("Location request timed out.");
                else toast.error("Failed to get location.");
                setIsLoadingRoute(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const isOpen = phase === 'open';
    const isClosing = phase === 'closing';

    return createPortal(
        <div className="loc-viewer-overlay" style={{
            opacity: isOpen ? 1 : isClosing ? 0 : 0,
        }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
            <style>{`
                .loc-viewer-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 999;
                    background: rgba(255,255,255,0.4);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    display: flex;
                    flex-direction: column;
                    transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .loc-viewer-header {
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 24px;
                    border-bottom: 1px solid rgba(255,255,255,0.4);
                    background: rgba(255,255,255,0.7);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                }
                .loc-viewer-content {
                    flex: 1;
                    display: flex;
                    padding: 24px;
                    gap: 24px;
                    box-sizing: border-box;
                    overflow: hidden;
                }
                .loc-viewer-sidebar {
                    width: 320px;
                    background: rgba(255,255,255,0.85);
                    border-radius: 24px;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.08);
                    border: 1px solid rgba(255,255,255,0.5);
                    overflow-y: auto;
                    flex-shrink: 0;
                }
                .loc-viewer-map-container {
                    flex: 1;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    background: white;
                    border: 1px solid rgba(255,255,255,0.5);
                    position: relative;
                }
                /* Hide zoom, 3d, and fullscreen controls */
                .loc-viewer-map-container .mapboxgl-ctrl-top-right,
                .loc-viewer-map-container .mapboxgl-ctrl-top-left,
                .loc-viewer-map-container .mapboxgl-ctrl-bottom-right {
                    display: none !important;
                }
                /* Shrink Mappls logo */
                .loc-viewer-map-container img,
                .loc-viewer-map-container .mapboxgl-ctrl-bottom-left {
                    transform: scale(0.6);
                    transform-origin: bottom left;
                    opacity: 0.8;
                }
                .loc-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 14px 16px;
                    border: none;
                    border-radius: 14px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .loc-btn-google {
                    background: #3b82f6;
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                .loc-btn-google:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
                }
                .loc-btn-mappls {
                    background: #1f2937;
                    color: white;
                    box-shadow: 0 4px 12px rgba(31, 41, 55, 0.3);
                }
                .loc-btn-mappls:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(31, 41, 55, 0.4);
                }
                .loc-btn-mappls:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                @media (max-width: 768px) {
                    .loc-viewer-content {
                        flex-direction: column;
                        overflow-y: auto;
                    }
                    .loc-viewer-sidebar {
                        width: 100%;
                        flex: none;
                    }
                    .loc-viewer-map-container {
                        min-height: 400px;
                        flex: none;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="loc-viewer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#8763ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MdLocationOn size={24} color="white" />
                    </div>
                    <div>
                        <h2 className='select-none' style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1f2937' }}>Location Details</h2>
                        <p className='select-none' style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Shared Location</p>
                    </div>
                </div>
                <button
                    onClick={triggerClose}
                    style={{
                        width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        color: '#374151', transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                >
                    <MdClose size={24} />
                </button>
            </div>

            {/* Content area: Sidebar + Map */}
            <div className="loc-viewer-content">
                {/* Sidebar */}
                <div className="loc-viewer-sidebar">
                    {routesData.length > 0 && (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <h3 className='select-none' style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Available Routes</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {routesData.map((route, idx) => {
                                        const isActive = idx === activeRouteIndex;
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => setActiveRouteIndex(idx)}
                                                style={{
                                                    padding: '12px', borderRadius: 12, cursor: 'pointer',
                                                    border: isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                                    background: isActive ? '#eff6ff' : 'white',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                    <span className='select-none' style={{ fontSize: 15, fontWeight: 700, color: isActive ? '#1e3a8a' : '#374151' }}>
                                                        Route {idx + 1}
                                                    </span>
                                                    <span className='select-none' style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#3b82f6' : '#6b7280' }}>
                                                        {formatDistance(route.distance)}
                                                    </span>
                                                </div>
                                                <div className='select-none' style={{ fontSize: 13, color: isActive ? '#1e40af' : '#4b5563' }}>
                                                    Est. Time: <strong style={{ color: isActive ? '#14532d' : 'inherit' }}>{formatDuration(route.duration)}</strong>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className='select-none' style={{ width: '100%', height: 1, background: 'rgba(0,0,0,0.08)' }} />
                        </>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <h3 className='select-none' style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Actions</h3>

                        <button className="loc-btn loc-btn-google" onClick={handleGoogleDirections}>
                            <MdDirections size={22} />
                            Get Directions (Google)
                        </button>

                        <button className="loc-btn loc-btn-mappls" onClick={handleMapplsDirections} disabled={isLoadingRoute}>
                            {isLoadingRoute ? (
                                <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'civ-spin 1s linear infinite' }} />
                            ) : (
                                <MdNavigation size={22} />
                            )}
                            {isLoadingRoute ? 'Calculating...' : 'Route on Mappls'}
                        </button>
                    </div>

                    {msg.locationDetails?.address && (
                        <>
                            <div className='select-none' style={{ width: '100%', height: 1, background: 'rgba(0,0,0,0.08)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <h3 className='select-none' style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Address</h3>
                                <p className='select-none' style={{ margin: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.5 }}>
                                    {msg.locationDetails?.address || "Location"}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Map Container */}
                <div className="loc-viewer-map-container">
                    {MAPPLS_TOKEN ? (
                        <div id="mappls-interactive-map" style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
                            <div style={{ textAlign: 'center' }}>
                                <MdLocationOn size={64} color="#8763ea" />
                                <h3 style={{ marginTop: 16, fontSize: 18, color: '#374151', fontWeight: 600 }}>Map Preview Unavailable</h3>
                                <p style={{ marginTop: 8, color: '#6b7280' }}>Please configure Mappls token</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

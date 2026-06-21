import React, { useState, useRef, useEffect } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { MdClose, MdUndo, MdRedo, MdCheck } from "react-icons/md";
import { BsCrop } from "react-icons/bs";
import { GrRotateLeft, GrRotateRight } from "react-icons/gr";
import { FiSquare } from "react-icons/fi";
import { BiImage, BiPalette } from "react-icons/bi";
import { PiPaintBrush, PiArrowRight, PiEraser, PiMinus } from "react-icons/pi";
import { TbWand, TbFlipHorizontal } from "react-icons/tb";

const RATIOS = [
    { label: "Free", value: NaN, icon: <BsCrop size={18} /> },
    { label: "Original", value: 0, icon: <BiImage size={18} /> },
    { label: "Square", value: 1, id: "square", icon: <FiSquare size={18} /> },
    { label: "3:2", value: 3 / 2 },
    { label: "4:3", value: 4 / 3 },
    { label: "5:4", value: 5 / 4 },
    { label: "16:9", value: 16 / 9 },
    { label: "2:3", value: 2 / 3 },
    { label: "3:4", value: 3 / 4 },
    { label: "4:5", value: 4 / 5 },
    { label: "9:16", value: 9 / 16 },
];

const COLORS = [
    "#FFFFFF", "#EF4444", "#F97316", "#FBBF24", "#22C55E", 
    "#6EE7B7", "#3B82F6", "#6366F1", "#A855F7", "color-picker"
];

const TOOLS = [
    { id: 'pen', label: 'Pen', icon: <PiMinus size={20} className="rotate-45" /> },
    { id: 'arrow', label: 'Arrow', icon: <PiArrowRight size={20} /> },
    { id: 'brush', label: 'Brush', icon: <PiPaintBrush size={20} /> },
    { id: 'neon', label: 'Neon', icon: <TbWand size={20} /> },
    { id: 'eraser', label: 'Eraser', icon: <PiEraser size={20} /> },
];

export default function ImageEditor({ imageUrl, onCancel, onSave }) {
    const cropperRef = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    
    // UI State
    const [activeTab, setActiveTab] = useState('brush'); // 'brush' or 'crop'
    
    // Cropper State
    const [aspectRatio, setAspectRatio] = useState(NaN);
    const [scaleX, setScaleX] = useState(1);
    const [activeRatioId, setActiveRatioId] = useState("free");
    
    // Drawing State
    const [color, setColor] = useState("#FFFFFF");
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(0);
    const [brightness, setBrightness] = useState(100);
    const shadeBoxRef = useRef(null);
    const [brushSize, setBrushSize] = useState(5);
    const [activeTool, setActiveTool] = useState('pen');
    const [isDrawing, setIsDrawing] = useState(false);
    const [paths, setPaths] = useState([]); // History of drawn paths
    const [currentPath, setCurrentPath] = useState(null); // Path currently being drawn

    // ------------- COLOR HELPERS -------------
    const hsvToRgb = (h, s, v) => {
        s /= 100; v /= 100;
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;
        let r, g, b;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        ];
    };

    const rgbToHex = (r, g, b) => {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    };

    const updateColorFromHSV = (h, s, v) => {
        const [r, g, b] = hsvToRgb(h, s, v);
        setColor(rgbToHex(r, g, b));
    };

    const handleShadeBoxInteraction = (e) => {
        const rect = shadeBoxRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        const s = (x / rect.width) * 100;
        const v = 100 - (y / rect.height) * 100;
        setSaturation(s);
        setBrightness(v);
        updateColorFromHSV(hue, s, v);
    };

    const getRGBString = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
        }
        return '255, 255, 255';
    };

    // Resize canvas to match natural image dimensions or container bounds
    useEffect(() => {
        if (activeTab !== 'brush') return;
        
        // When switching to brush, we need to know the dimensions of the image 
        // to overlay the canvas exactly on top. 
        // For simplicity in a web UI like Telegram's, the brush draws on top of the CROPPER's view,
        // or we temporarily disable cropper drag mode and let them draw on the wrapper.
        // Let's set cropper drag mode depending on the tab.
        if (cropperRef.current?.cropper) {
            cropperRef.current.cropper.setDragMode(activeTab === 'crop' ? 'crop' : 'none');
        }
    }, [activeTab]);

    const handleSave = () => {
        if (typeof cropperRef.current?.cropper !== "undefined") {
            const cropperCanvas = cropperRef.current?.cropper.getCroppedCanvas();
            
            if (cropperCanvas) {
                // If there are drawings, we need to composite the drawing canvas over the cropper canvas.
                // Since the drawing canvas is sized to the cropper container, we must map the drawing 
                // coordinates back to the cropped output.
                
                // For a robust implementation, we draw the paths directly onto the cropped canvas context
                // mapping them according to the crop box data.
                if (paths.length > 0) {
                    const ctx = cropperCanvas.getContext('2d');
                    const cropBox = cropperRef.current.cropper.getCropBoxData();
                    const canvasData = cropperRef.current.cropper.getCanvasData();
                    const imgData = cropperRef.current.cropper.getImageData();

                    // Calculate scale ratio between the visible canvas container and the actual natural image
                    const scaleX = imgData.naturalWidth / imgData.width;
                    const scaleY = imgData.naturalHeight / imgData.height;

                    // The cropBox is relative to the container. The output cropperCanvas contains just the cropped area.
                    // When we draw on our overlay canvas, coordinates are relative to the container.
                    
                    ctx.save();
                    // We need to translate the context so that (0,0) of container matches up to the crop box top-left.
                    // And we scale it so that 1px on container = scaleX px on natural image.
                    ctx.scale(scaleX, scaleY);
                    ctx.translate(-cropBox.left, -cropBox.top);

                    // Redraw all paths
                    paths.forEach(path => {
                        if (path.points.length < 2) return;
                        ctx.beginPath();
                        ctx.strokeStyle = path.tool === 'eraser' ? 'rgba(0,0,0,1)' : path.color; // Eraser needs complex compositing, simple hack here
                        if (path.tool === 'eraser') ctx.globalCompositeOperation = 'destination-out';
                        else ctx.globalCompositeOperation = 'source-over';

                        // Apply Neon effect or normal stroke
                        if (path.tool === 'neon') {
                            ctx.shadowBlur = path.size * 2;
                            ctx.shadowColor = path.color;
                            ctx.strokeStyle = '#FFFFFF';
                        } else {
                            ctx.shadowBlur = 0;
                        }

                        ctx.lineWidth = path.size;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        
                        ctx.moveTo(path.points[0].x, path.points[0].y);
                        for (let i = 1; i < path.points.length; i++) {
                            ctx.lineTo(path.points[i].x, path.points[i].y);
                        }
                        ctx.stroke();

                        // Add arrowhead if arrow tool
                        if (path.tool === 'arrow' && path.points.length > 1) {
                            const p1 = path.points[path.points.length - 2];
                            const p2 = path.points[path.points.length - 1];
                            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                            const headlen = path.size * 4;
                            ctx.beginPath();
                            ctx.moveTo(p2.x + (headlen * 0.4) * Math.cos(angle), p2.y + (headlen * 0.4) * Math.sin(angle));
                            ctx.lineTo(p2.x - headlen * Math.cos(angle - Math.PI / 7), p2.y - headlen * Math.sin(angle - Math.PI / 7));
                            ctx.lineTo(p2.x - (headlen * 0.6) * Math.cos(angle), p2.y - (headlen * 0.6) * Math.sin(angle));
                            ctx.lineTo(p2.x - headlen * Math.cos(angle + Math.PI / 7), p2.y - headlen * Math.sin(angle + Math.PI / 7));
                            ctx.closePath();
                            ctx.fillStyle = path.color;
                            ctx.fill();
                        }
                    });
                    
                    // Apply horizontal flip to drawing if cropped image was flipped
                    if (scaleX === -1) {
                         // Drawing was already mirrored because cropper flipped the view, but the output blob doesn't 
                         // unless we explicitly transform it or cropper does it automatically. 
                         // Actually cropper handles scale in `getCroppedCanvas`, so drawing needs no extra flip 
                         // if we mapped to unscaled container correctly.
                    }

                    ctx.restore();
                }

                // Return final image as Blob
                cropperCanvas.toBlob((blob) => {
                    if (blob) {
                        onSave(blob);
                    }
                }, 'image/jpeg', 0.9);
            }
        }
    };

    // ------------- CROP LOGIC -------------
    const handleRatioChange = (ratio) => {
        setAspectRatio(ratio.value);
        setActiveRatioId(ratio.id || ratio.label.toLowerCase());

        if (cropperRef.current?.cropper) {
            if (ratio.label === "Original" && cropperRef.current.cropper.getImageData()) {
                const imgData = cropperRef.current.cropper.getImageData();
                cropperRef.current.cropper.setAspectRatio(imgData.naturalWidth / imgData.naturalHeight);
            } else {
                cropperRef.current.cropper.setAspectRatio(ratio.value);
            }
        }
    };

    const handleRotate = (degree) => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) return;
        // Clear crop box first so rotation doesn't get clipped by old bounds
        cropper.clear();
        cropper.rotate(degree);
        // Re-apply crop after rotation so it fits the new orientation
        setTimeout(() => {
            cropper.crop();
        }, 50);
    };

    const handleRotateLeft = () => handleRotate(-90);
    const handleRotateRight = () => handleRotate(90);
    const handleFlipHorizontal = () => {
        const newScale = scaleX === 1 ? -1 : 1;
        setScaleX(newScale);
        cropperRef.current?.cropper.scaleX(newScale);
    };
    
    // Undo affects either drawing or cropping based on active tab
    const handleUndo = () => {
        if (activeTab === 'crop') {
            cropperRef.current?.cropper.reset();
        } else if (activeTab === 'brush') {
            setPaths(paths.slice(0, -1));
            redrawCanvas(paths.slice(0, -1));
        }
    };

    // ------------- DRAWING LOGIC -------------
    const getPointerPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        // Support touch and mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        if (activeTab !== 'brush') return;
        setIsDrawing(true);
        const pos = getPointerPos(e);
        const newPath = {
            color,
            size: brushSize,
            tool: activeTool,
            points: [pos]
        };
        setCurrentPath(newPath);
    };

    const draw = (e) => {
        if (!isDrawing || activeTab !== 'brush') return;
        e.preventDefault(); // Prevent scrolling while drawing on mobile
        
        const pos = getPointerPos(e);
        setCurrentPath(prev => ({
            ...prev,
            points: [...prev.points, pos]
        }));

        // Render live path
        const ctx = canvasRef.current.getContext('2d');
        redrawCanvas(paths); // Draw old paths
        renderPath(ctx, { ...currentPath, points: [...currentPath.points, pos] }); // Draw current
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentPath && currentPath.points.length > 0) {
            const newPaths = [...paths, currentPath];
            setPaths(newPaths);
            setCurrentPath(null);
            redrawCanvas(newPaths);
        }
    };

    const redrawCanvas = (pathsList) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pathsList.forEach(path => renderPath(ctx, path));
    };

    const renderPath = (ctx, path) => {
        if (path.points.length < 2) return;
        
        ctx.beginPath();
        if (path.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = path.tool === 'neon' ? '#FFFFFF' : path.color;
        }

        if (path.tool === 'neon') {
            ctx.shadowBlur = path.size * 2;
            ctx.shadowColor = path.color;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.lineWidth = path.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();

        // Arrow head logic
        if (path.tool === 'arrow' && path.points.length > 1) {
            const p1 = path.points[path.points.length - 2];
            const p2 = path.points[path.points.length - 1];
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const headlen = path.size * 4;
            
            ctx.beginPath();
            // Start at the tip of the arrow
            ctx.moveTo(p2.x + (headlen * 0.4) * Math.cos(angle), p2.y + (headlen * 0.4) * Math.sin(angle));
            // Back to left wing
            ctx.lineTo(p2.x - headlen * Math.cos(angle - Math.PI / 7), p2.y - headlen * Math.sin(angle - Math.PI / 7));
            // Inwards slightly for cooler shape
            ctx.lineTo(p2.x - (headlen * 0.6) * Math.cos(angle), p2.y - (headlen * 0.6) * Math.sin(angle));
            // Down to right wing
            ctx.lineTo(p2.x - headlen * Math.cos(angle + Math.PI / 7), p2.y - headlen * Math.sin(angle + Math.PI / 7));
            
            ctx.closePath();
            ctx.fillStyle = path.color;
            ctx.fill();
            
            // Revert shadow/composite for next paths
            ctx.shadowBlur = 0;
            ctx.globalCompositeOperation = 'source-over';
        }
    };

    // Ensure canvas dimensions match its display size so internal resolution is correct
    useEffect(() => {
        if (canvasRef.current && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            canvasRef.current.width = rect.width;
            canvasRef.current.height = rect.height;
            redrawCanvas(paths);
        }
    }, [paths]);


    return (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col md:flex-row text-gray-800 w-full h-full">
            
            {/* Main Editing Area */}
            <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center relative bg-gray-100 overflow-hidden">
                {/* Mobile Header */}
                <div className="absolute top-0 left-0 w-full flex justify-between items-center p-4 md:hidden z-20 bg-gradient-to-b from-white/80 to-transparent">
                    <button onClick={onCancel} className="p-2 bg-white/80 rounded-full text-gray-600 hover:text-gray-900 transition cursor-pointer shadow-sm">
                        <MdClose size={24} />
                    </button>
                    <span className="font-semibold text-lg text-gray-800">Edit Media</span>
                    <button onClick={handleSave} className="p-2 bg-[#8774FE] rounded-full text-white hover:bg-[#7b6be6] transition cursor-pointer shadow-sm">
                        <MdCheck size={24} />
                    </button>
                </div>
                
                {/* Image Cropper Layer */}
                <div className="absolute inset-0 w-full h-full pt-16 pb-16 md:py-8 flex items-center justify-center">
                    <Cropper
                        ref={cropperRef}
                        src={imageUrl}
                        style={{ height: "100%", width: "100%" }}
                        aspectRatio={aspectRatio}
                        guides={true}
                        viewMode={1}
                        dragMode={activeTab === 'crop' ? 'crop' : 'none'}
                        background={false}
                        autoCropArea={1}
                        autoCrop={true}
                        restore={false}
                        center={true}
                        responsive={true}
                        checkOrientation={false}
                        rotatable={true}
                        minCropBoxWidth={50}
                        minCropBoxHeight={50}
                        zoomable={activeTab === 'crop'}
                    />
                </div>

                {/* Drawing Canvas Layer Overlay */}
                <canvas 
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full z-10 touch-none pointer-events-auto"
                    style={{ pointerEvents: activeTab === 'brush' ? 'auto' : 'none' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />

                {/* Bottom Rotation & Flip Controls (Crop Only) */}
                {activeTab === 'crop' && (
                    <div className="absolute bottom-4 left-0 w-full flex justify-center gap-8 items-center bg-transparent z-20 pb-4 md:pb-0">
                        <button onClick={handleRotateLeft} className="p-3 text-gray-500 hover:text-gray-800 bg-white/80 rounded-full transition cursor-pointer backdrop-blur-md shadow-sm" title="Rotate Left">
                            <GrRotateLeft size={20} />
                        </button>
                        <button onClick={handleFlipHorizontal} className="p-3 text-[#8774FE] hover:text-[#6b5cd4] bg-white/80 rounded-full transition cursor-pointer backdrop-blur-md shadow-sm" title="Mirror / Flip">
                            <TbFlipHorizontal size={22} />
                        </button>
                        <button onClick={handleRotateRight} className="p-3 text-gray-500 hover:text-gray-800 bg-white/80 rounded-full transition cursor-pointer backdrop-blur-md shadow-sm" title="Rotate Right">
                            <GrRotateRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Right Sidebar (Settings) */}
            <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col max-h-[40vh] md:max-h-full overflow-y-auto">
                {/* Sidebar Header */}
                <div className="hidden md:flex items-center justify-between p-4 border-b border-gray-200">
                    <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition cursor-pointer">
                        <MdClose size={24} />
                    </button>
                    <h2 className="font-semibold text-lg text-gray-800">Edit Media</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handleUndo} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition cursor-pointer" title="Undo">
                            <MdUndo size={22} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition opacity-50 cursor-not-allowed" title="Redo (Not Implemented)">
                            <MdRedo size={22} />
                        </button>
                    </div>
                </div>

                {/* Toolbar Context Switch */}
                <div className="flex border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab('brush')}
                        className={`flex-1 py-4 text-center transition border-b-2 font-medium flex justify-center 
                            ${activeTab === 'brush' ? 'border-[#8774FE] text-[#8774FE]' : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <BiPalette size={20} />
                    </button>
                    <button 
                        onClick={() => setActiveTab('crop')}
                        className={`flex-1 py-4 text-center transition border-b-2 font-medium flex justify-center 
                            ${activeTab === 'crop' ? 'border-[#8774FE] text-[#8774FE]' : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <BsCrop size={20} />
                    </button>
                </div>

                {/* Contextual Options Area */}
                <div className="p-6 flex-1 overflow-y-auto scrollbar-telegram">
                    
                    {/* ----- BRUSH TAB ----- */}
                    {activeTab === 'brush' && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Functional Color Picker */}
                            <div className="flex flex-col gap-4 mb-4">
                                {/* Hue Slider */}
                                <div className="h-4 w-full rounded-full relative overflow-hidden" style={{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}>
                                    <input 
                                        type="range" min="0" max="360" 
                                        value={hue}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            const h = parseInt(e.target.value);
                                            setHue(h);
                                            updateColorFromHSV(h, saturation, brightness);
                                        }}
                                    />
                                    <div 
                                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg pointer-events-none" 
                                        style={{ 
                                            left: `${(hue / 360) * 100}%`, 
                                            transform: 'translate(-50%, -50%)',
                                            backgroundColor: `hsl(${hue}, 100%, 50%)` 
                                        }}
                                    ></div>
                                </div>

                                <div className="flex gap-4 h-32">
                                    {/* Saturation / Brightness Box */}
                                    <div 
                                        ref={shadeBoxRef}
                                        className="flex-1 rounded-lg border border-gray-200 relative cursor-crosshair select-none" 
                                        style={{
                                            backgroundColor: `hsl(${hue}, 100%, 50%)`,
                                            backgroundImage: 'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)'
                                        }}
                                        onMouseDown={(e) => handleShadeBoxInteraction(e)}
                                        onMouseMove={(e) => { if (e.buttons === 1) handleShadeBoxInteraction(e); }}
                                    >
                                        <div 
                                            className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
                                            style={{
                                                left: `${saturation}%`,
                                                top: `${100 - brightness}%`,
                                                transform: 'translate(-50%, -50%)',
                                                backgroundColor: color
                                            }}
                                        ></div>
                                    </div>
                                    
                                    {/* Hex/RGB readout */}
                                    <div className="flex flex-col gap-2 w-24">
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex flex-col justify-center text-xs text-gray-500">
                                            <span className="text-[10px]">HEX</span>
                                            <span className="text-gray-800 text-sm mt-0.5 font-mono">{color.toUpperCase()}</span>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex flex-col justify-center text-xs text-gray-500">
                                            <span className="text-[10px]">RGB</span>
                                            <span className="text-gray-800 text-[11px] mt-0.5 whitespace-nowrap font-mono">{getRGBString(color)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Size Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-500 text-sm font-medium">Size</span>
                                    <span className="text-gray-500 text-sm font-medium">{brushSize}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" max="25" 
                                    value={brushSize} 
                                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#EF4444]"
                                />
                            </div>

                            {/* Tools List */}
                            <div>
                                <h3 className="text-gray-500 text-sm mb-2 font-medium">Tool</h3>
                                <div className="space-y-1">
                                    {TOOLS.map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => setActiveTool(tool.id)}
                                            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition cursor-pointer
                                                ${activeTool === tool.id ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="w-8 flex justify-center text-[#EF4444] opacity-90">
                                                {tool.icon}
                                            </div>
                                            <span className="font-medium text-[15px]">{tool.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ----- CROP TAB ----- */}
                    {activeTab === 'crop' && (
                        <div className="animate-fadeIn">
                            <h3 className="text-gray-500 text-sm mb-4 font-medium uppercase tracking-wider">Aspect Ratio</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                {RATIOS.map((ratio) => (
                                    <button
                                        key={ratio.label}
                                        onClick={() => handleRatioChange(ratio)}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 cursor-pointer text-left
                                            ${(Number.isNaN(aspectRatio) && Number.isNaN(ratio.value) && activeRatioId === 'free') || 
                                              activeRatioId === (ratio.id || ratio.label.toLowerCase())
                                                ? "bg-gray-100 text-gray-800 font-semibold" 
                                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                            }`}
                                    >
                                        <div className="w-6 flex justify-center opacity-80">
                                            {ratio.icon ? ratio.icon : <div className="w-5 h-4 border border-current rounded-sm opacity-60"></div>}
                                        </div>
                                        <span className="text-sm">{ratio.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Save Button */}
                <div className="hidden md:flex justify-end p-6 pt-2">
                    <button onClick={handleSave} className="w-14 h-14 bg-[#8774FE] rounded-full text-white flex items-center justify-center hover:bg-[#6b5cd4] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xl">
                        <MdCheck size={32} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Add styles + force square crop (override any stale round-crop styles from HMR)
const IMAGE_EDITOR_STYLE_ID = 'image-editor-injected-styles';
const styles = `
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
    animation: fadeIn 0.15s ease-out forwards;
}

/* Force square crop - override any stale round styles */
.cropper-view-box,
.cropper-face {
    border-radius: 0 !important;
}

/* White crop outline matching the screenshot */
.cropper-view-box {
    outline: 2px solid rgba(255, 255, 255, 0.85) !important;
}

/* Large white rounded corner dots */
.cropper-point {
    width: 14px !important;
    height: 14px !important;
    border-radius: 50% !important;
    background-color: #ffffff !important;
    opacity: 1 !important;
    box-shadow: 0 0 4px rgba(0,0,0,0.3) !important;
}
.cropper-point.point-nw { top: -7px !important; left: -7px !important; }
.cropper-point.point-ne { top: -7px !important; right: -7px !important; }
.cropper-point.point-sw { bottom: -7px !important; left: -7px !important; }
.cropper-point.point-se { bottom: -7px !important; right: -7px !important; }

/* Smaller dots on edges */
.cropper-point.point-n,
.cropper-point.point-s,
.cropper-point.point-e,
.cropper-point.point-w {
    width: 10px !important;
    height: 10px !important;
    border-radius: 50% !important;
    background-color: #ffffff !important;
    opacity: 0.9 !important;
    box-shadow: 0 0 3px rgba(0,0,0,0.25) !important;
}

/* White semi-transparent crop lines */
.cropper-line {
    background-color: rgba(255, 255, 255, 0.4) !important;
}

/* White dashed guide lines (rule of thirds) */
.cropper-dashed {
    border-color: rgba(255, 255, 255, 0.35) !important;
}

/* Dim the area outside crop box */
.cropper-modal {
    background-color: rgba(0, 0, 0, 0.6) !important;
}`;
if (typeof document !== 'undefined') {
    // Remove old injected style tag if it exists (prevents HMR duplicates)
    const old = document.getElementById(IMAGE_EDITOR_STYLE_ID);
    if (old) old.remove();
    const styleSheet = document.createElement("style");
    styleSheet.id = IMAGE_EDITOR_STYLE_ID;
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

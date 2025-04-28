import React, { useRef, useState, useEffect } from 'react';

const SimpleCanvasDrawing = ({ onSave, onCancel, initialDrawing = null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [hasDrawing, setHasDrawing] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size to match container with high DPI support
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = 400 * dpr;

      // Scale context for high DPI displays
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = '400px';

      // Set initial canvas background to white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      setContext(ctx);

      // Load initial drawing if provided
      if (initialDrawing) {
        loadDrawingFromImage(initialDrawing);
      }
    }
  }, []);

  // Update context when brush settings change
  useEffect(() => {
    if (context) {
      context.lineWidth = brushSize;
      context.strokeStyle = brushColor;
      context.lineJoin = 'round';
      context.lineCap = 'round';
    }
  }, [brushColor, brushSize, context]);

  // Load drawing from image
  const loadDrawingFromImage = (imageUrl) => {
    if (!context || !canvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      context.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasDrawing(true);
    };
    img.src = imageUrl;
  };

  // Get position helper for both mouse and touch events
  const getPositionInCanvas = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    let clientX, clientY;

    // Handle both touch and mouse events
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches[0]) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Get position relative to canvas
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    return { x, y };
  };

  const startDrawing = (e) => {
    if (!context) return;

    e.preventDefault(); // Prevent scrolling on touch devices

    setIsDrawing(true);
    const { x, y } = getPositionInCanvas(e);
    setLastX(x);
    setLastY(y);

    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || !context) return;

    e.preventDefault();

    const { x, y } = getPositionInCanvas(e);

    // For smoother lines, especially for stylus
    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(x, y);
    context.stroke();

    setLastX(x);
    setLastY(y);
    setHasDrawing(true);
  };

  const stopDrawing = () => {
    if (context) {
      context.closePath();
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (context && canvasRef.current) {
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasDrawing(false);
    }
  };

  const handleSave = () => {
    if (canvasRef.current) {
      // Convert to smaller, more efficient format (PNG)
      const dataUrl = canvasRef.current.toDataURL('image/png', 0.8);

      // Create a temporary link to download the image
      const blobData = dataURItoBlob(dataUrl);
      const fileName = `drawing-${new Date().getTime()}.png`;

      // Create a FormData object to send as multipart/form-data
      const formData = new FormData();
      formData.append('file', blobData, fileName);

      // Pass blob and filename to parent component
      onSave(blobData, fileName, dataUrl);
    }
  };

  // Convert dataURI to Blob object
  const dataURItoBlob = (dataURI) => {
    // Convert base64 to raw binary data held in a string
    const byteString = atob(dataURI.split(',')[1]);

    // Separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // Write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  };

  const colorOptions = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFA500'];
  const sizeOptions = [2, 5, 10, 15, 20];

  return (
    <div className="border rounded-md p-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Color:</span>
          <div className="flex space-x-1">
            {colorOptions.map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full ${brushColor === color ? 'ring-2 ring-offset-2 ' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setBrushColor(color)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Size:</span>
          <div className="flex space-x-1">
            {sizeOptions.map((size) => (
              <button
                key={size}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  brushSize === size ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'
                }`}
                onClick={() => setBrushSize(size)}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: size, height: size }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full border rounded cursor-crosshair bg-white"
        style={{ touchAction: 'none' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
        onPointerDown={startDrawing} // For stylus support
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
      />

      <div className="flex justify-between mt-4">
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Clear
        </button>

        <div className="space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasDrawing}
            className={`px-4 py-2 ${
              hasDrawing ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'
            } text-white rounded`}
          >
            Save Drawing
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleCanvasDrawing;

import React, { useRef, useState, useEffect } from 'react';

const SimpleCanvasDrawing = ({ onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size to match container
      canvas.width = canvas.offsetWidth;
      canvas.height = 400;

      // Set initial canvas background to white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      setContext(ctx);
    }
  }, []);

  useEffect(() => {
    if (context) {
      context.lineWidth = brushSize;
      context.strokeStyle = brushColor;
      context.lineJoin = 'round';
      context.lineCap = 'round';
    }
  }, [brushColor, brushSize, context]);

  const startDrawing = (e) => {
    if (!context) return;

    setIsDrawing(true);
    context.beginPath();

    // Get mouse position relative to canvas
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || !context) return;

    // Get mouse position relative to canvas
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
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
    }
  };

  const handleSave = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
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
                className={`w-6 h-6 rounded-full ${brushColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
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
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Save Drawing
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleCanvasDrawing;

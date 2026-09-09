'use client';

import { useRef, useState } from 'react';
import { Box, Button } from '@mui/material';

/**
 * Minimal canvas-based signature capture. Calls onChange with a PNG data
 * URL as the user draws, and with null after Clear.
 * @param {{ onChange: (dataUrl: string | null) => void }} props
 */
export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
    };
  }

  function startDrawing(e) {
    e.preventDefault();
    drawingRef.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.stroke();
  }

  function stopDrawing() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    setHasSignature(true);
    onChange(canvasRef.current.toDataURL('image/png'));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange(null);
  }

  return (
    <Box>
      <Box
        component="canvas"
        ref={canvasRef}
        width={400}
        height={150}
        sx={{
          width: '100%',
          touchAction: 'none',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <Button size="small" onClick={clear} disabled={!hasSignature} sx={{ mt: 1 }}>
        Clear
      </Button>
    </Box>
  );
}

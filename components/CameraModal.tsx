
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { XMarkIcon, CameraIcon, SwitchCameraIcon } from './icons';

interface CameraModalProps {
  onCapture: (photoDataUrl: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    // Stop any existing stream
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }

    setError(null);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 },
            }
        });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    } catch (err) {
        console.error("Error accessing camera:", err);
        let message = "Could not access the camera.";
        if (err instanceof Error) {
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                message = "Camera permission was denied. Please enable it in your browser settings.";
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                message = "No camera found on this device.";
            }
        }
        setError(message);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    
    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video to avoid distortion
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // Use JPEG for smaller file size
        onCapture(dataUrl);
      }
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)' }}
      ></video>
      <canvas ref={canvasRef} className="hidden"></canvas>

      {error && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-100 text-red-800 p-4 rounded-lg text-center max-w-sm">
            <p className="font-bold">Camera Error</p>
            <p>{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-black bg-opacity-50 flex justify-between items-center">
        {/* Left-side action: Switch Camera */}
        <button
          onClick={handleSwitchCamera}
          className="p-3 text-white bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          aria-label="Switch camera"
          disabled={!!error}
        >
          <SwitchCameraIcon className="w-8 h-8"/>
        </button>

        {/* Center action: Capture Photo */}
        <button
          onClick={handleCapture}
          className="p-4 border-4 border-white rounded-full bg-transparent hover:bg-white/20 transition-colors"
          aria-label="Capture photo"
          disabled={!!error}
        >
          <CameraIcon className="w-10 h-10 text-white" />
        </button>
        
        {/* Right-side action: Close */}
        <button
          onClick={onClose}
          className="p-3 text-white bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          aria-label="Close camera"
        >
          <XMarkIcon className="w-8 h-8"/>
        </button>
      </div>
    </div>
  );
};

export default CameraModal;

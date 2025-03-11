import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, Loader2 } from 'lucide-react';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [expression, setExpression] = useState('');

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        startVideo();
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };

    loadModels();
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const handleVideoPlay = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      if (!video || !canvas) return;

      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections) {
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw face detection box
        faceapi.draw.drawDetections(canvas, resizedDetections);

        // Get the dominant expression
        const expressions = detections.expressions;
        const dominantExpression = Object.entries(expressions).reduce((a, b) => 
          a[1] > b[1] ? a : b
        )[0];
        
        setExpression(dominantExpression);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Camera className="w-8 h-8" />
            Mood Detection
          </h1>
          <p className="text-gray-400">Real-time facial expression detection using your camera</p>
        </div>

        {isModelLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading AI models...</p>
          </div>
        ) : (
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              onPlay={handleVideoPlay}
              width="720"
              height="560"
              className="w-full"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
            
            {expression && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm p-4 rounded-lg">
                <p className="text-xl font-semibold">
                  Current Mood: <span className="text-emerald-400 capitalize">{expression}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Loader } from 'lucide-react';

const ParkingAnalyzer = () => {
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleImageCapture = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeImages = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze images');
      }

      const result = await response.json();
      setResult(result);
    } catch (err) {
      setError("Failed to analyze parking signs. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Can I Park Here?</h1>
        
        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative flex-none">
                  <img 
                    src={img} 
                    alt={`Parking sign ${index + 1}`} 
                    className="h-40 w-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Camera/Upload Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white p-4 rounded-lg"
          >
            <Camera size={20} />
            <span>Take Photo</span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-500 text-white p-4 rounded-lg"
          >
            <Upload size={20} />
            <span>Upload</span>
          </button>
        </div>

        {/* Hidden Input Fields */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageCapture}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageCapture}
          className="hidden"
        />
        
        {/* Analyze Button */}
        {images.length > 0 && (
          <button
            onClick={analyzeImages}
            disabled={isAnalyzing}
            className="w-full bg-green-500 text-white p-4 rounded-lg mb-6 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader className="animate-spin" size={20} />
                <span>Analyzing...</span>
              </>
            ) : (
              <span>Analyze Signs</span>
            )}
          </button>
        )}
        
        {/* Results */}
        {result && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className={`text-2xl ${result.canPark ? 'text-green-500' : 'text-red-500'}`}>
                {result.canPark ? '✓' : '✗'}
              </div>
              <h2 className="text-xl font-semibold">
                {result.canPark ? 'Parking Allowed' : 'No Parking'}
              </h2>
            </div>
            
            <p className="mb-4 text-gray-600">{result.explanation}</p>
            
            {result.restrictions?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Restrictions:</h3>
                <ul className="list-disc pl-5">
                  {result.restrictions.map((restriction, index) => (
                    <li key={index} className="text-gray-600">{restriction}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.timeLimit && (
              <p className="text-sm text-gray-500">
                Time limit: {result.timeLimit} minutes
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkingAnalyzer;

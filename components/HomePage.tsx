import React, { useState, useEffect } from 'react';
import { GalleryItem } from '../types';
import { BOT_NAME } from '../constants';

interface HomePageProps {
  assets: GalleryItem[];
  enterApp: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ assets, enterApp }) => {
  const videos = assets.filter(item => item.type === 'video');
  const images = assets.filter(item => item.type === 'image');

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (videos.length > 1) {
      const interval = setInterval(() => {
        setIsFading(true);
        setTimeout(() => {
          setCurrentVideoIndex(prevIndex => (prevIndex + 1) % videos.length);
          setIsFading(false);
        }, 1000); // Fade duration
      }, 7000); // Time each video plays
      return () => clearInterval(interval);
    }
  }, [videos.length]);

  return (
    <div className="relative w-screen h-screen bg-black text-white font-sans">
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden">
        {videos.length > 0 ? (
          videos.map((video, index) => (
            <video
              key={video.id}
              className={`absolute top-1/2 left-1/2 w-full h-full min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 ${
                index === currentVideoIndex && !isFading ? 'opacity-100' : 'opacity-0'
              }`}
              src={video.url}
              autoPlay
              loop
              muted
              playsInline
            />
          ))
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <p className="text-gray-400">No background videos have been set by the admin.</p>
          </div>
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center p-8 text-center">
        <header>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
            Welcome to {BOT_NAME}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
            Your personal assistant for quick and easy orders. Chat with our bot to get started.
          </p>
          <button
            onClick={enterApp}
            className="mt-8 px-8 py-4 bg-green-500 text-white font-bold text-lg rounded-full shadow-lg hover:bg-green-600 transform hover:scale-105 transition-all duration-300"
          >
            Start Your Order
          </button>
        </header>

        {/* Image Gallery */}
        {images.length > 0 && (
          <section className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-30 backdrop-blur-sm">
            <h2 className="text-center text-sm font-semibold mb-2 uppercase tracking-wider">Gallery</h2>
            <div className="flex justify-center items-center space-x-4 overflow-x-auto pb-2">
              {images.map(image => (
                <img
                  key={image.id}
                  src={image.url}
                  alt={image.prompt}
                  title={image.prompt}
                  className="w-24 h-24 object-cover rounded-lg shadow-md border-2 border-transparent hover:border-white transition-all cursor-pointer"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default HomePage;

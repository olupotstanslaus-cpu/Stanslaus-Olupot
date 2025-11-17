import React from 'react';
import { GalleryItem } from '../types';
import { BOT_NAME } from '../constants';

interface HomePageProps {
  assets: GalleryItem[];
  enterApp: () => void;
  appLogoUrl: string | null;
}

const HomePage: React.FC<HomePageProps> = ({ assets, enterApp, appLogoUrl }) => {
  const images = assets.filter(item => item.type === 'image');
  
  const backgroundVideoUrl = "https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4";

  return (
    <div className="relative w-screen h-screen font-sans text-white overflow-hidden">
        <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
            src={backgroundVideoUrl}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 z-10"></div>
        
        <div className="relative z-20 flex flex-col h-full overflow-y-auto">
            <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 flex-shrink-0">
                <div className="flex justify-between items-center py-4">
                    {/* Left side */}
                    <div className="flex items-center space-x-8">
                        {appLogoUrl ? (
                            <img src={appLogoUrl} alt={`${BOT_NAME} logo`} className="h-10 w-auto" />
                        ) : (
                            <div className="text-2xl font-bold tracking-wider cursor-pointer">
                                {BOT_NAME}
                            </div>
                        )}
                        <nav className="hidden md:flex items-center space-x-8">
                            <a href="#" className="text-base font-medium hover:text-green-300 transition-colors">About Us</a>
                            <a href="#" className="text-base font-medium hover:text-green-300 transition-colors">Contact Us</a>
                        </nav>
                    </div>
                    {/* Right side */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <a href="#" className="text-base font-medium hover:text-green-300 transition-colors">Home</a>
                        <button onClick={enterApp} className="text-base font-medium hover:text-green-300 transition-colors">Admin</button>
                        <button onClick={enterApp} className="text-base font-medium hover:text-green-300 transition-colors">Order</button>
                    </nav>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg">
                    Welcome to {BOT_NAME}
                </h1>
                <p className="mt-4 text-lg md:text-xl text-gray-200 max-w-2xl mx-auto drop-shadow-md">
                    Your personal assistant for quick and easy orders via our web chat.
                </p>
                <button
                    onClick={enterApp}
                    className="mt-8 px-8 py-4 bg-green-500 text-white font-bold text-lg rounded-full shadow-lg hover:bg-green-600 transform hover:scale-105 transition-all duration-300"
                >
                    Start Web Order
                </button>
            </main>

            {/* Image Gallery */}
            {images.length > 0 && (
                <footer className="w-full max-w-5xl mx-auto p-4 flex-shrink-0">
                <h2 className="text-center text-sm font-semibold mb-2 uppercase tracking-wider text-gray-300">Gallery</h2>
                <div className="flex justify-center items-center space-x-4 overflow-x-auto pb-2">
                    {images.map(image => (
                    <img
                        key={image.id}
                        src={image.url}
                        alt={image.prompt}
                        title={image.prompt}
                        className="flex-shrink-0 w-24 h-24 object-cover rounded-lg shadow-md border-2 border-transparent hover:border-green-500 transition-all cursor-pointer"
                    />
                    ))}
                </div>
                </footer>
            )}
        </div>
    </div>
  );
};

export default HomePage;
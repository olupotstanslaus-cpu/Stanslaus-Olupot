import React from 'react';
import { GalleryItem } from '../types';
import { BOT_NAME } from '../constants';

interface HomePageProps {
  assets: GalleryItem[];
  enterApp: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ assets, enterApp }) => {
  const images = assets.filter(item => item.type === 'image');
  
  const whatsappNumber = "256772715106";
  const whatsappQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wa.me/${whatsappNumber}`;

  return (
    <div className="w-screen h-screen bg-gray-50 text-gray-800 font-sans flex flex-col items-center p-4 sm:p-8 overflow-y-auto">
      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900">
            Welcome to {BOT_NAME}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Your personal assistant for quick and easy orders. Click below or scan the QR code to get started.
          </p>
          <button
            onClick={enterApp}
            className="mt-8 px-8 py-4 bg-green-500 text-white font-bold text-lg rounded-full shadow-lg hover:bg-green-600 transform hover:scale-105 transition-all duration-300"
          >
            Start Web Order
          </button>
        </header>

        {/* WhatsApp QR Code Section */}
        <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-3 text-gray-800">Scan to Chat on WhatsApp</h2>
            <div className="flex justify-center">
                <img src={whatsappQrCodeUrl} alt="WhatsApp QR Code" className="w-40 h-40 rounded-lg border-4 border-gray-200" />
            </div>
            <p className="mt-4 font-semibold text-gray-700">Or add us: +256 772 715106</p>
        </section>
      </main>

      {/* Image Gallery */}
      {images.length > 0 && (
        <footer className="w-full max-w-5xl p-4 mt-auto">
          <h2 className="text-center text-sm font-semibold mb-2 uppercase tracking-wider text-gray-500">Gallery</h2>
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
  );
};

export default HomePage;
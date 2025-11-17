import React, { useState } from 'react';
import { GalleryItem } from '../types';
import { generateAdCopy } from '../services/geminiService';
import { MegaphoneIcon, SparklesIcon, ImageIcon } from './Icons';
import { BOT_NAME } from '../constants';

interface AdvertisingGeneratorProps {
    galleryItems: GalleryItem[];
}

const AdvertisingGenerator: React.FC<AdvertisingGeneratorProps> = ({ galleryItems }) => {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedAds, setGeneratedAds] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

    const images = galleryItems.filter(item => item.type === 'image');

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setError('');
        setGeneratedAds([]);
        try {
            const ads = await generateAdCopy(topic);
            setGeneratedAds(ads);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Ad copy copied to clipboard!');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Generator & Results */}
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-md border space-y-4">
                    <h3 className="text-xl font-semibold text-gray-700 flex items-center">
                        <MegaphoneIcon className="w-6 h-6 mr-2 text-blue-500" />
                        Ad Copy Generator
                    </h3>
                    <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., Weekend special: 50% off on all pizzas"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        rows={3}
                    />
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 disabled:bg-gray-400 transition-colors flex items-center justify-center">
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        {isLoading ? 'Generating...' : 'Generate Ad Copy'}
                    </button>
                    {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
                </div>

                {generatedAds.length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow-md border space-y-4">
                         <h3 className="text-xl font-semibold text-gray-700">Generated Options</h3>
                         <div className="space-y-4">
                            {generatedAds.map((ad, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-md border relative">
                                    <p className="text-gray-800 whitespace-pre-wrap">{ad}</p>
                                    <button 
                                        onClick={() => handleCopyToClipboard(ad)}
                                        className="absolute top-2 right-2 bg-gray-200 text-gray-700 px-2 py-1 text-xs font-semibold rounded hover:bg-gray-300"
                                    >
                                        Copy
                                    </button>
                                </div>
                            ))}
                         </div>
                    </div>
                )}
            </div>

            {/* Right Side: Media & Preview */}
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">1. Select an Image</h3>
                    {images.length > 0 ? (
                         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                            {images.map(image => (
                                <img 
                                    key={image.id}
                                    src={image.url}
                                    alt={image.prompt}
                                    onClick={() => setSelectedImage(image)}
                                    className={`w-full h-24 object-cover rounded-md cursor-pointer transition-all ${selectedImage?.id === image.id ? 'ring-4 ring-blue-500' : 'hover:opacity-80'}`}
                                />
                            ))}
                         </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <ImageIcon className="w-12 h-12 mx-auto text-gray-300" />
                            <p className="mt-2">No images in gallery. Go to the Media tab to add some.</p>
                        </div>
                    )}
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">2. Ad Preview</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-2 flex items-center space-x-2 border-b">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">{BOT_NAME.charAt(0)}</div>
                            <div>
                                <p className="font-semibold text-sm">{BOT_NAME}</p>
                                <p className="text-xs text-gray-500">Sponsored</p>
                            </div>
                        </div>
                        {selectedImage && <img src={selectedImage.url} alt="Ad preview" className="w-full h-auto object-cover max-h-60" />}
                        <div className="p-3 text-sm">
                            <p className="whitespace-pre-wrap">{generatedAds[0] || "Your generated ad copy will appear here..."}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvertisingGenerator;

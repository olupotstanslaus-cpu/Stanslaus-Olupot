import React, { useState, useMemo } from 'react';
import { GalleryItem, Advertisement } from '../types';
import { generateAdCopy } from '../services/geminiService';
import { MegaphoneIcon, SparklesIcon, TrashIcon, EyeIcon, MousePointerClickIcon } from './Icons';

interface AdvertisingManagerProps {
    galleryItems: GalleryItem[];
    advertisements: Advertisement[];
    addAdvertisement: (ad: Omit<Advertisement, 'id' | 'views' | 'clicks'>) => void;
    toggleAdStatus: (adId: string) => void;
    deleteAdvertisement: (adId: string) => void;
}

const AdCreator: React.FC<{
    galleryItems: GalleryItem[];
    addAdvertisement: (ad: Omit<Advertisement, 'id' | 'views' | 'clicks'>) => void;
}> = ({ galleryItems, addAdvertisement }) => {
    const [headline, setHeadline] = useState('');
    const [body, setBody] = useState('');
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [genError, setGenError] = useState('');
    const [generatedCopies, setGeneratedCopies] = useState<string[]>([]);
    
    const images = galleryItems.filter(item => item.type === 'image');

    const handleGenerateCopy = async () => {
        if (!headline.trim()) {
            setGenError('Please enter a headline or topic first to generate copy.');
            return;
        }
        setIsGenerating(true);
        setGenError('');
        setGeneratedCopies([]);
        try {
            const copies = await generateAdCopy(headline);
            setGeneratedCopies(copies);
        } catch (e) {
            setGenError(e instanceof Error ? e.message : 'An unknown error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateAd = () => {
        if (!headline.trim() || !body.trim()) {
            alert('Please fill in both headline and body.');
            return;
        }
        addAdvertisement({
            headline,
            body,
            imageId: selectedImageId,
            isActive: true,
        });
        // Reset form
        setHeadline('');
        setBody('');
        setSelectedImageId(null);
        setGeneratedCopies([]);
        alert('Advertisement created successfully!');
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">Create New Advertisement</h3>
            
            <div>
                <label htmlFor="adHeadline" className="block mb-2 text-sm font-medium text-gray-900">Headline / Topic</label>
                <input
                    type="text"
                    id="adHeadline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="e.g., Weekend Special: 50% Off All Pizzas"
                />
            </div>

            <div>
                 <label htmlFor="adBody" className="block mb-2 text-sm font-medium text-gray-900">Ad Body</label>
                <textarea
                    id="adBody"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    rows={4}
                    placeholder="Write your ad copy here, or generate it with AI."
                />
                <button onClick={handleGenerateCopy} disabled={isGenerating} className="mt-2 text-sm text-blue-600 hover:underline flex items-center disabled:opacity-50">
                    <SparklesIcon className="w-4 h-4 mr-1"/>
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                </button>
            </div>

            {genError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{genError}</p>}
            {generatedCopies.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">AI Suggestions (click to use):</h4>
                    {generatedCopies.map((copy, i) => (
                        <p key={i} onClick={() => setBody(copy)} className="text-sm p-2 bg-gray-100 rounded cursor-pointer hover:bg-blue-100 border transition-colors">{copy}</p>
                    ))}
                </div>
            )}
            
            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Select an Image (Optional)</h4>
                 {images.length > 0 ? (
                     <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded border">
                        {images.map(image => (
                            <img 
                                key={image.id}
                                src={image.url}
                                alt={image.prompt}
                                onClick={() => setSelectedImageId(image.id === selectedImageId ? null : image.id)}
                                className={`w-full h-20 object-cover rounded-md cursor-pointer transition-all ${selectedImageId === image.id ? 'ring-4 ring-blue-500' : 'hover:opacity-80'}`}
                            />
                        ))}
                     </div>
                ) : (
                    <p className="text-sm text-gray-500">No images available in the media gallery.</p>
                )}
            </div>

            <button onClick={handleCreateAd} className="w-full bg-blue-500 text-white px-4 py-3 rounded-md font-semibold hover:bg-blue-600 transition-colors">
                Create Ad
            </button>
        </div>
    );
};

const AdCard: React.FC<{
    ad: Advertisement;
    image: GalleryItem | undefined;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ ad, image, onToggle, onDelete }) => {
    return (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
             <div className="p-3 flex items-center justify-between border-b bg-gray-50">
                <h4 className="font-bold text-gray-800 truncate pr-4">{ad.headline}</h4>
                <div className="flex items-center space-x-3">
                    <label htmlFor={`toggle-${ad.id}`} className="relative inline-flex items-center cursor-pointer" title={ad.isActive ? 'Deactivate Ad' : 'Activate Ad'}>
                        <input
                            type="checkbox"
                            id={`toggle-${ad.id}`}
                            className="sr-only peer"
                            checked={ad.isActive}
                            onChange={() => onToggle(ad.id)}
                        />
                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                    <button onClick={() => onDelete(ad.id)} className="text-gray-400 hover:text-red-500" title="Delete Ad">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
            
            <div className="p-3">
                {image && <img src={image.url} alt={ad.headline} className="w-full h-32 object-cover rounded-md mb-3" />}
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{ad.body}</p>
            </div>
            <div className="border-t bg-gray-50 px-3 py-2 flex items-center justify-end space-x-4">
                <div className="flex items-center space-x-1 text-sm text-gray-600" title="Views">
                    <EyeIcon className="w-4 h-4" />
                    <span>{ad.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-600" title="Clicks">
                    <MousePointerClickIcon className="w-4 h-4" />
                    <span>{ad.clicks.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

const AdvertisingManager: React.FC<AdvertisingManagerProps> = (props) => {
    const { advertisements, galleryItems, addAdvertisement, toggleAdStatus, deleteAdvertisement } = props;
    
    const adsWithSimulatedMetrics = useMemo(() => {
        return advertisements.map(ad => {
            if (!ad.isActive) return { ...ad, views: 0, clicks: 0 };
            
            const idHash = ad.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const views = (idHash % 5000) + 500;
            const clicks = Math.floor(views * ((idHash % 10) / 100 + 0.01));
            
            return { ...ad, views, clicks };
        });
    }, [advertisements]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <AdCreator galleryItems={galleryItems} addAdvertisement={addAdvertisement} />
            
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">Manage Advertisements ({advertisements.length})</h3>
                {advertisements.length > 0 ? (
                    <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                        {adsWithSimulatedMetrics.slice().reverse().map(ad => {
                            const adImage = galleryItems.find(item => item.id === ad.imageId);
                            return <AdCard key={ad.id} ad={ad} image={adImage} onToggle={toggleAdStatus} onDelete={deleteAdvertisement} />;
                        })}
                    </div>
                ) : (
                     <div className="text-center py-16 bg-white rounded-lg shadow-md border">
                        <MegaphoneIcon className="w-16 h-16 mx-auto text-gray-300" />
                        <p className="mt-4 text-gray-500">No advertisements have been created yet.</p>
                        <p className="mt-1 text-sm text-gray-400">Use the form to create your first ad.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvertisingManager;
import React, { useState, useEffect } from 'react';
import { GalleryItem } from '../types';
import { generateImageFromPrompt, generateVideoFromPrompt, generateSpeechFromText } from '../services/geminiService';
import { ImageIcon, VideoIcon, MicIcon, UsersIcon, SparklesIcon, PlusCircleIcon, CheckCircleIcon, TrashIcon, UploadIcon } from './Icons';

// Helper to convert AudioBuffer to a WAV Blob
const bufferToWave = (abuffer: AudioBuffer, len: number): Blob => {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [],
        i,
        sample,
        offset = 0,
        pos = 0;
  
    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
  
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit
  
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length
  
    // write interleaved data
    for (i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));
  
    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
        view.setInt16(pos, sample, true); // write 16-bit sample
        pos += 2;
      }
      offset++; // next source sample
    }
  
    return new Blob([view], { type: "audio/wav" });
  
    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }
  
    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
};
  
interface MediaGeneratorProps {
    galleryItems: GalleryItem[];
    addGalleryItem: (item: Omit<GalleryItem, 'id'>) => void;
    toggleHomePageAsset: (itemId: string) => void;
    deleteGalleryItem: (itemId: string) => void;
}

const ImageGenerator: React.FC<{ addGalleryItem: MediaGeneratorProps['addGalleryItem'] }> = ({ addGalleryItem }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError('');
        setGeneratedImage(null);
        try {
            const imageUrl = await generateImageFromPrompt(prompt);
            setGeneratedImage(imageUrl);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToGallery = () => {
        if (generatedImage) {
            addGalleryItem({
                type: 'image',
                url: generatedImage,
                prompt: prompt,
                isHomePageAsset: false
            });
            setGeneratedImage(null);
            setPrompt('');
            alert('Image added to gallery!');
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">Generate Image</h3>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A futuristic cityscape at sunset, neon lights"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                rows={3}
            />
            <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 disabled:bg-gray-400 transition-colors flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 mr-2"/>
                {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
            {generatedImage && (
                <div className="space-y-3 text-center">
                    <img src={generatedImage} alt={prompt} className="rounded-lg max-w-full mx-auto h-auto max-h-80 shadow-md" />
                    <button onClick={handleAddToGallery} className="w-full bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600 transition-colors flex items-center justify-center">
                        <PlusCircleIcon className="w-5 h-5 mr-2" />
                        Add to Gallery
                    </button>
                </div>
            )}
        </div>
    );
};

const VideoGenerator: React.FC<{ addGalleryItem: MediaGeneratorProps['addGalleryItem'] }> = ({ addGalleryItem }) => {
    const [prompt, setPrompt] = useState('');
    const [progress, setProgress] = useState('');
    const [error, setError] = useState('');
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [isKeySelected, setIsKeySelected] = useState(true); // Assume true initially
    const isLoading = !!progress;

    useEffect(() => {
        window.aistudio.hasSelectedApiKey().then(hasKey => setIsKeySelected(hasKey));
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
            setIsKeySelected(true); 
            setError("API Key selected. Please click Generate again.");
            return;
        }

        setProgress('Starting...');
        setError('');
        setGeneratedVideo(null);

        try {
            const videoUrl = await generateVideoFromPrompt(prompt, (message) => setProgress(message));
            setGeneratedVideo(videoUrl);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
            setError(errorMessage);
            if (errorMessage.includes("Requested entity was not found")) {
                setIsKeySelected(false);
                setError("Your API Key is invalid. Please select a valid key and try again.");
            }
        } finally {
            setProgress('');
        }
    };

    const handleAddToGallery = () => {
        if (generatedVideo) {
            addGalleryItem({
                type: 'video',
                url: generatedVideo,
                prompt: prompt,
                isHomePageAsset: false
            });
            setGeneratedVideo(null);
            setPrompt('');
            alert('Video added to gallery!');
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">Generate Video</h3>
            {!isKeySelected && (
                <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                    Video generation requires a user-provided API key. Please <button onClick={() => window.aistudio.openSelectKey()} className="font-semibold underline hover:text-yellow-900">select a key</button> to continue. For more info, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-yellow-900">billing documentation</a>.
                </div>
            )}
             <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A drone shot of a tropical beach at sunrise"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                rows={3}
            />
            <button onClick={handleGenerate} disabled={isLoading || !isKeySelected} className="w-full bg-purple-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-purple-600 disabled:bg-gray-400 transition-colors flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 mr-2"/>
                {isLoading ? 'Generating...' : 'Generate Video'}
            </button>
            {progress && <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md animate-pulse">{progress}</p>}
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
            {generatedVideo && (
                <div className="space-y-3 text-center">
                    <video src={generatedVideo} controls autoPlay loop className="rounded-lg max-w-full mx-auto h-auto max-h-80 shadow-md" />
                    <button onClick={handleAddToGallery} className="w-full bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600 transition-colors flex items-center justify-center">
                        <PlusCircleIcon className="w-5 h-5 mr-2" />
                        Add to Gallery
                    </button>
                </div>
            )}
        </div>
    );
};

const VoiceGenerator: React.FC = () => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        setError('');
        setAudioUrl(null);
        try {
            const audioBuffer = await generateSpeechFromText(text);
            const wavBlob = bufferToWave(audioBuffer, audioBuffer.length);
            const url = URL.createObjectURL(wavBlob);
            setAudioUrl(url);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-md border space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">Generate Voice</h3>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g., Welcome to our store! How can I help you today?"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                rows={3}
            />
            <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-teal-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-teal-600 disabled:bg-gray-400 transition-colors flex items-center justify-center">
                 <MicIcon className="w-5 h-5 mr-2"/>
                {isLoading ? 'Generating...' : 'Generate Voice'}
            </button>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
            {audioUrl && (
                <div className="space-y-3">
                     <audio src={audioUrl} controls className="w-full" />
                </div>
            )}
        </div>
    );
};

const Uploader: React.FC<{ addGalleryItem: MediaGeneratorProps['addGalleryItem'] }> = ({ addGalleryItem }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            addGalleryItem({
                type,
                url,
                prompt: file.name, // Use filename as prompt
                isHomePageAsset: false
            });
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} "${file.name}" uploaded and added to gallery!`);
            event.target.value = '';
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">Upload Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                    <span className="flex items-center space-x-2">
                        <ImageIcon className="w-6 h-6 text-gray-600" />
                        <span className="font-medium text-gray-600">Upload Image</span>
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'image')}
                        className="hidden"
                    />
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                     <span className="flex items-center space-x-2">
                        <VideoIcon className="w-6 h-6 text-gray-600" />
                        <span className="font-medium text-gray-600">Upload Video</span>
                    </span>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileChange(e, 'video')}
                        className="hidden"
                    />
                </label>
            </div>
        </div>
    );
};

const GalleryManager: React.FC<{ items: GalleryItem[]; onToggle: (id: string) => void; onDelete: (id: string) => void; }> = ({ items, onToggle, onDelete }) => {
    if (items.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-lg shadow-md border">
                <UsersIcon className="w-16 h-16 mx-auto text-gray-300" />
                <p className="mt-4 text-gray-500">Your gallery is empty.</p>
                <p className="mt-1 text-sm text-gray-400">Upload or generate some media to get started.</p>
            </div>
        );
    }
    return (
        <div className="bg-white p-4 rounded-lg shadow-md border space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">Media Gallery</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map(item => (
                    <div key={item.id} className="relative group border rounded-lg overflow-hidden shadow">
                       {item.type === 'image' ? (
                           <img src={item.url} alt={item.prompt} className="w-full h-32 object-cover" />
                       ) : (
                           <video src={item.url} muted loop className="w-full h-32 object-cover" />
                       )}
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                            <p className="text-white text-xs text-center line-clamp-3">{item.prompt}</p>
                        </div>
                        <button 
                            onClick={() => onDelete(item.id)}
                            className="absolute top-1 left-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                            aria-label="Delete item"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                        <div className="absolute top-1 right-1 flex items-center bg-black/50 p-1 rounded-full">
                           <label htmlFor={`toggle-hp-${item.id}`} className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id={`toggle-hp-${item.id}`}
                                    className="sr-only peer"
                                    checked={item.isHomePageAsset}
                                    onChange={() => onToggle(item.id)}
                                />
                                <div className="w-11 h-6 bg-gray-400 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-white/80 px-2 py-1 text-xs text-gray-800 font-semibold flex items-center">
                            <CheckCircleIcon className={`w-4 h-4 mr-1 ${item.isHomePageAsset ? 'text-green-600' : 'text-gray-300'}`} />
                            <span className="truncate">Home Page</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MediaGenerator: React.FC<MediaGeneratorProps> = ({ galleryItems, addGalleryItem, toggleHomePageAsset, deleteGalleryItem }) => {
    const [activeTab, setActiveTab] = useState('gallery');

    const TabButton: React.FC<{label: string, tabName: string, icon: React.ReactNode}> = ({label, tabName, icon}) => (
        <button
           onClick={() => setActiveTab(tabName)}
           className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium text-center rounded-t-lg transition-colors ${
               activeTab === tabName
               ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
               : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
           }`}
           >
           {icon}
           <span>{label}</span>
       </button>
     );
    
    return (
        <div className="space-y-4">
            <div className="flex space-x-2 border-b">
                <TabButton label="Gallery" tabName="gallery" icon={<UsersIcon className="w-5 h-5" />} />
                <TabButton label="Upload" tabName="upload" icon={<UploadIcon className="w-5 h-5" />} />
                <TabButton label="Generate Image" tabName="image" icon={<ImageIcon className="w-5 h-5" />} />
                <TabButton label="Generate Video" tabName="video" icon={<VideoIcon className="w-5 h-5" />} />
                <TabButton label="Generate Voice" tabName="voice" icon={<MicIcon className="w-5 h-5" />} />
            </div>
            <div className="p-1">
                {activeTab === 'gallery' && <GalleryManager items={galleryItems} onToggle={toggleHomePageAsset} onDelete={deleteGalleryItem} />}
                {activeTab === 'upload' && <Uploader addGalleryItem={addGalleryItem} />}
                {activeTab === 'image' && <ImageGenerator addGalleryItem={addGalleryItem} />}
                {activeTab === 'video' && <VideoGenerator addGalleryItem={addGalleryItem} />}
                {activeTab === 'voice' && <VoiceGenerator />}
            </div>
        </div>
    );
};

export default MediaGenerator;
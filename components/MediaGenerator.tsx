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
    const [isKeySelected, setIsKeySelected] = useState(false);
    const isLoading = !!progress;

    useEffect(() => {
        window.aistudio.hasSelectedApiKey().then(hasKey => setIsKeySelected(hasKey));
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
            setIsKeySelected(true); // Assume key selection is successful
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
                    Video generation requires a user-provided API key. Please <button onClick={async () => { await window.aistudio.openSelectKey(); setIsKeySelected(true); }} className="font-semibold underline hover:text-yellow-900">select a key</button> to continue. For more info, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-yellow-900">billing documentation</a>.
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

const GalleryManager: React.FC<{ items: GalleryItem[]; onToggle: (id: string) => void; onDelete: (id: string) => void; onGenerateNarration: (item: GalleryItem) => void; narratingItemId: string | null; }> = ({ items, onToggle, onDelete, onGenerateNarration, narratingItemId }) => {
    if (items.length === 0) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-md border space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">Media Gallery</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="relative border border-gray-200 rounded-lg bg-gray-50">
                            <div className="w-full h-32 flex items-center justify-center">
                                <ImageIcon className="w-10 h-10 text-gray-300" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-center text-gray-500 pt-2">
                    <p>Your gallery is empty. Upload or generate media to see it here.</p>
                </div>
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
                       ) : item.type === 'video' ? (
                           <video src={item.url} muted loop className="w-full h-32 object-cover" />
                       ) : (
                           <div className="w-full h-32 bg-teal-50 flex flex-col items-center justify-center p-2 text-teal-700">
                               <MicIcon className="w-10 h-10" />
                               <audio src={item.url} controls className="w-full h-8 mt-2" />
                           </div>
                       )}
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                            <p className="text-white text-xs text-center line-clamp-3">{item.prompt}</p>
                        </div>

                        <div className="absolute top-1 left-1 flex items-center space-x-1 z-10">
                            <button 
                                onClick={() => onDelete(item.id)}
                                className="bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                aria-label="Delete item"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                             {(item.type === 'image' || item.type === 'video') && (
                                <button
                                    onClick={() => onGenerateNarration(item)}
                                    disabled={narratingItemId === item.id}
                                    className="bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-700 disabled:bg-gray-400 disabled:opacity-100"
                                    aria-label="Generate Narration"
                                >
                                    {narratingItemId === item.id ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    ) : (
                                    <MicIcon className="w-4 h-4" />
                                    )}
                                </button>
                            )}
                        </div>

                        {item.type !== 'audio' && (
                            <>
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
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const MediaGenerator: React.FC<MediaGeneratorProps> = ({ galleryItems, addGalleryItem, toggleHomePageAsset, deleteGalleryItem }) => {
    const [activeTab, setActiveTab] = useState('gallery');
    const [narratingItemId, setNarratingItemId] = useState<string | null>(null);
    const [isVideoGenerationEnabled, setIsVideoGenerationEnabled] = useState(false);
    const [showVideoEnableModal, setShowVideoEnableModal] = useState(false);

    const handleVideoToggle = () => {
        if (!isVideoGenerationEnabled) {
            setShowVideoEnableModal(true);
        } else {
            if (activeTab === 'video') {
                setActiveTab('gallery');
            }
            setIsVideoGenerationEnabled(false);
        }
    };

    const confirmEnableVideo = () => {
        setIsVideoGenerationEnabled(true);
        setShowVideoEnableModal(false);
    };

    const handleGenerateNarration = async (item: GalleryItem) => {
        if (!item.prompt) {
          alert("This item has no prompt to narrate.");
          return;
        }
        setNarratingItemId(item.id);
        try {
          const audioBuffer = await generateSpeechFromText(item.prompt);
          const wavBlob = bufferToWave(audioBuffer, audioBuffer.length);
          const url = URL.createObjectURL(wavBlob);
          addGalleryItem({
            type: 'audio',
            url: url,
            prompt: `Narration for: "${item.prompt}"`,
            isHomePageAsset: false,
          });
          alert('Narration added to gallery as a new audio asset!');
        } catch (e) {
          alert(`Failed to generate narration: ${e instanceof Error ? e.message : 'Unknown error'}`);
          console.error(e);
        } finally {
          setNarratingItemId(null);
        }
    };

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
            {showVideoEnableModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto animate-fade-in-up">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Enable Video Generation</h2>
                        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm text-left space-y-2">
                            <p className="font-semibold">Please be aware:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>This feature uses advanced video generation models which may incur costs on your API key.</li>
                                <li>A valid API key with billing enabled is required for this feature to work.</li>
                                <li>You will be prompted to select your API key if one is not already configured after enabling.</li>
                            </ul>
                            <div className="text-center pt-2">
                                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">
                                    Learn more about billing
                                </a>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowVideoEnableModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmEnableVideo}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 transition-colors"
                            >
                                Acknowledge & Enable
                            </button>
                        </div>
                    </div>
                </div>
            )}
             <div className="bg-white p-3 rounded-lg shadow-md border flex justify-between items-center">
                <div className="flex items-center">
                    <VideoIcon className="w-6 h-6 mr-3 text-purple-500" />
                    <div>
                        <h4 className="font-semibold text-gray-800">Advanced Video Generation</h4>
                        <p className="text-sm text-gray-500">Enable to generate videos from text prompts.</p>
                    </div>
                </div>
                <label htmlFor="video-toggle" className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        id="video-toggle"
                        className="sr-only peer"
                        checked={isVideoGenerationEnabled}
                        onChange={handleVideoToggle}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer
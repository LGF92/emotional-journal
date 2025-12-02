import React, { useState, useEffect } from 'react';
import { Heart, Eye, Ear, Activity, Wind, Droplet, Plus, Calendar, TrendingUp, X, LogOut, User, Upload, Image, Video, Mic } from 'lucide-react';

const EmotionalJournal = () => {
  const [entries, setEntries] = useState([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentEntry, setCurrentEntry] = useState({
    title: '',
    content: '',
    emotions: [],
    sensory: {
      visual: '',
      auditory: '',
      tactile: '',
      olfactory: '',
      gustatory: ''
    },
    media: null
  });

  const emotionOptions = [
    { name: 'Joy', intensity: 0, color: 'bg-yellow-400' },
    { name: 'Sadness', intensity: 0, color: 'bg-blue-400' },
    { name: 'Anger', intensity: 0, color: 'bg-red-400' },
    { name: 'Fear', intensity: 0, color: 'bg-purple-400' },
    { name: 'Love', intensity: 0, color: 'bg-pink-400' },
    { name: 'Anxiety', intensity: 0, color: 'bg-orange-400' },
    { name: 'Peace', intensity: 0, color: 'bg-green-400' },
    { name: 'Excitement', intensity: 0, color: 'bg-indigo-400' }
  ];

  const [selectedEmotions, setSelectedEmotions] = useState(
    emotionOptions.map(e => ({ ...e, intensity: 0 }))
  );

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = () => {
    const storedUser = localStorage.getItem('current-user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      loadEntries(userData.id);
    }
    setLoading(false);
  };

  const signIn = () => {
    const email = prompt('Enter your email to sign in:');
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email');
      return;
    }

    const userId = email.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const userData = { id: userId, email: email };
    
    localStorage.setItem('current-user', JSON.stringify(userData));
    setUser(userData);
    loadEntries(userId);
  };

  const signOut = () => {
    localStorage.removeItem('current-user');
    setUser(null);
    setEntries([]);
  };

  const loadEntries = (userId) => {
    const allEntries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(`entry-${userId}:`)) {
        const entry = JSON.parse(localStorage.getItem(key));
        allEntries.push(entry);
      }
    }
    setEntries(allEntries.sort((a, b) => b.relevanceScore - a.relevanceScore));
  };

  const calculateRelevanceScore = (entry) => {
    const emotionScore = entry.emotions.reduce((sum, e) => sum + e.intensity, 0);
    const sensoryCount = Object.values(entry.sensory).filter(v => v.trim() !== '').length;
    const sensoryScore = sensoryCount * 10;
    const contentDepth = Math.min(entry.content.length / 50, 20);
    const mediaBonus = entry.media ? 15 : 0;
    
    return emotionScore + sensoryScore + contentDepth + mediaBonus;
  };

  const handleEmotionChange = (index, intensity) => {
    const updated = [...selectedEmotions];
    updated[index].intensity = intensity;
    setSelectedEmotions(updated);
  };

  const handleSensoryChange = (sense, value) => {
    setCurrentEntry({
      ...currentEntry,
      sensory: { ...currentEntry.sensory, [sense]: value }
    });
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const mediaData = {
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio',
        data: event.target.result,
        name: file.name
      };
      setCurrentEntry({ ...currentEntry, media: mediaData });
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setCurrentEntry({ ...currentEntry, media: null });
  };

  const saveEntry = () => {
    if (!user) return;
    
    const activeEmotions = selectedEmotions.filter(e => e.intensity > 0);
    const entry = {
      ...currentEntry,
      emotions: activeEmotions,
      timestamp: new Date().toISOString(),
      id: Date.now(),
      userId: user.id
    };
    
    entry.relevanceScore = calculateRelevanceScore(entry);
    
    localStorage.setItem(`entry-${user.id}:${entry.id}`, JSON.stringify(entry));
    loadEntries(user.id);
    resetForm();
  };

  const deleteEntry = (id) => {
    if (!user) return;
    localStorage.removeItem(`entry-${user.id}:${id}`);
    loadEntries(user.id);
  };

  const resetForm = () => {
    setCurrentEntry({
      title: '',
      content: '',
      emotions: [],
      sensory: { visual: '', auditory: '', tactile: '', olfactory: '', gustatory: '' },
      media: null
    });
    setSelectedEmotions(emotionOptions.map(e => ({ ...e, intensity: 0 })));
    setShowNewEntry(false);
  };

  const SensoryIcon = ({ type }) => {
    const icons = {
      visual: Eye,
      auditory: Ear,
      tactile: Activity,
      olfactory: Wind,
      gustatory: Droplet
    };
    const Icon = icons[type];
    return <Icon className="w-4 h-4" />;
  };

  const MediaPreview = ({ media, size = 'large' }) => {
    if (!media) return null;

    if (media.type === 'image') {
      return (
        <img 
          src={media.data} 
          alt="Journal media" 
          className={`${size === 'large' ? 'w-full h-64' : 'w-full h-48'} object-cover rounded-lg`}
        />
      );
    }

    if (media.type === 'video') {
      return (
        <video 
          src={media.data} 
          controls 
          className={`${size === 'large' ? 'w-full h-64' : 'w-full h-48'} rounded-lg`}
        />
      );
    }

    if (media.type === 'audio') {
      return (
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-lg flex items-center justify-center gap-4">
          <Mic className="w-8 h-8 text-purple-600" />
          <audio src={media.data} controls className="flex-1" />
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-purple-500" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Emotional Depth Journal</h1>
          <p className="text-gray-600 mb-6">Your memories, prioritized by emotional intensity & sensory richness</p>
          <button
            onClick={signIn}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5" />
            Sign In to Start Journaling
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Your entries are stored securely and privately
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Emotional Depth Journal</h1>
              <p className="text-gray-600">Welcome, {user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        <button
          onClick={() => setShowNewEntry(true)}
          className="w-full mb-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          New Journal Entry
        </button>

        {showNewEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Create Entry</h2>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Entry title..."
                value={currentEntry.title}
                onChange={(e) => setCurrentEntry({ ...currentEntry, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-lg"
              />

              <textarea
                placeholder="What happened? How did you feel?"
                value={currentEntry.content}
                onChange={(e) => setCurrentEntry({ ...currentEntry, content: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 h-32 resize-none"
              />

              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Media (Photo, Video, or Audio) - Required
                </h3>
                
                {!currentEntry.media ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*,video/*,audio/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                      id="media-upload"
                    />
                    <label htmlFor="media-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-3 text-gray-400">
                          <Image className="w-8 h-8" />
                          <Video className="w-8 h-8" />
                          <Mic className="w-8 h-8" />
                        </div>
                        <p className="text-gray-600 font-medium">Click to upload media</p>
                        <p className="text-sm text-gray-400">Photo, Video, or Audio (max 5MB)</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={removeMedia}
                      className="absolute top-2 right-2 z-10 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <MediaPreview media={currentEntry.media} />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Emotions (slide to set intensity)
                </h3>
                <div className="space-y-3">
                  {selectedEmotions.map((emotion, index) => (
                    <div key={emotion.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">{emotion.name}</span>
                        <span className="text-sm font-semibold">{emotion.intensity}/10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={emotion.intensity}
                        onChange={(e) => handleEmotionChange(index, parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-3">Sensory Details</h3>
                <div className="space-y-3">
                  {Object.keys(currentEntry.sensory).map((sense) => (
                    <div key={sense}>
                      <label className="flex items-center gap-2 text-sm text-gray-600 mb-1 capitalize">
                        <SensoryIcon type={sense} />
                        {sense}
                      </label>
                      <input
                        type="text"
                        placeholder={`What did you ${sense === 'visual' ? 'see' : sense === 'auditory' ? 'hear' : sense === 'tactile' ? 'feel' : sense === 'olfactory' ? 'smell' : 'taste'}?`}
                        value={currentEntry.sensory[sense]}
                        onChange={(e) => handleSensoryChange(sense, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={saveEntry}
                disabled={!currentEntry.title || !currentEntry.content || !currentEntry.media}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Entry
              </button>
              {!currentEntry.media && (
                <p className="text-center text-sm text-red-500 mt-2">Media attachment is required</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{entry.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Relevance: {entry.relevanceScore.toFixed(1)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {entry.media && (
                <div className="mb-4">
                  <MediaPreview media={entry.media} size="medium" />
                </div>
              )}

              <p className="text-gray-700 mb-4">{entry.content}</p>

              {entry.emotions.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {entry.emotions.map((emotion) => (
                      <span
                        key={emotion.name}
                        className={`${emotion.color} text-white px-3 py-1 rounded-full text-sm font-medium`}
                      >
                        {emotion.name} ({emotion.intensity}/10)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Object.values(entry.sensory).some(v => v) && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-2">Sensory Details:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {Object.entries(entry.sensory).map(([sense, value]) => 
                      value && (
                        <div key={sense} className="flex items-start gap-2 text-gray-600">
                          <SensoryIcon type={sense} />
                          <span className="flex-1">{value}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {entries.length === 0 && !showNewEntry && (
            <div className="text-center py-12 text-gray-500">
              <Heart className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>No entries yet. Start journaling to capture your memories!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmotionalJournal;

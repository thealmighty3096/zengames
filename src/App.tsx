import React, { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import matchSoundFile from './assets/audio/match.mp3';
import completeSoundFile from './assets/audio/complete.mp3';
import { Analytics } from '@vercel/analytics/react';

// Multiple sets of zen-themed emojis
const emojiSets = [
  ['🎉', '🎈', '🎂', '🎁', '🥳', '🎇', '🍾', '🎊'],
  ['😂', '🤣', '😜', '😱', '🤯', '😈', '🤪', '🤑'],
  ['🍕', '🍔', '🌮', '🍣', '🍩', '🍦', '🥑', '🥩'],
  ['🚀', '🌕', '🌟', '🌌', '☄️', '🛰️', '🌠', '⚡'],
  ['🐢', '🌿', '🍃', '🪴', '🌱', '🎋', '🌳', '🌲'],
  ['🪷', '🍀', '🌿', '🎍', '🌱', '🌾', '🎋', '🌳'],
  ['🐢', '🦎', '🦕', '🐊', '🐸', '🦖', '🦎', '🐊'],
  ['🌲', '🌳', '🌴', '🌵', '🌱', '🌿', '☘️', '🍀'],
  ['🪴', '🎋', '🎍', '🌳', '🌲', '🌴', '🌵', '🎄']
];

// Sound effects using local files
const matchSound = new Audio(matchSoundFile);
const completeSound = new Audio(completeSoundFile);

matchSound.volume = 0.3;
completeSound.volume = 0.3;

// Preload sounds
matchSound.load();
completeSound.load();

interface Tile {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function App() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [flippedTiles, setFlippedTiles] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [currentEmojiSetIndex, setCurrentEmojiSetIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showScorePopup, setShowScorePopup] = useState<{score: number, x: number, y: number} | null>(null);
  const [showFinalScore, setShowFinalScore] = useState(false);

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#8B9B7E', '#5C6355', '#2F3327', '#E5E7E1']
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const initializeGame = () => {
    const nextSetIndex = (currentEmojiSetIndex + 1) % emojiSets.length;
    setCurrentEmojiSetIndex(nextSetIndex);
    
    const currentEmojis = emojiSets[nextSetIndex];
    const duplicatedEmojis = [...currentEmojis, ...currentEmojis];
    const shuffledEmojis = duplicatedEmojis.sort(() => Math.random() - 0.5);
    
    const newTiles = shuffledEmojis.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
    }));
    
    setTiles(newTiles);
    setFlippedTiles([]);
    setProgress(0);
    setScore(0);
    setStreak(0);
    setShowFinalScore(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    const matchedCount = tiles.filter(tile => tile.isMatched).length;
    const newProgress = (matchedCount / tiles.length) * 100;
    setProgress(newProgress);
    
    if (newProgress === 100) {
      completeSound.play().catch(() => console.log('Sound playback failed'));
      triggerConfetti();
      setTimeout(() => setShowFinalScore(true), 500);
    }
  }, [tiles]);

  const showFloatingScore = (points: number, x: number, y: number) => {
    setShowScorePopup({ score: points, x, y });
    setTimeout(() => setShowScorePopup(null), 1000);
  };

  const handleTileClick = (id: number) => {
    if (isChecking || flippedTiles.includes(id) || tiles[id].isMatched) return;

    const newFlippedTiles = [...flippedTiles, id];
    setFlippedTiles(newFlippedTiles);

    if (newFlippedTiles.length === 2) {
      setIsChecking(true);
      const [firstId, secondId] = newFlippedTiles;
      
      const getClickPosition = () => {
        return {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        };
      };
      
      if (tiles[firstId].emoji === tiles[secondId].emoji) {
        matchSound.play().catch(() => console.log('Sound playback failed'));
        const streakBonus = streak * 20;
        const pointsEarned = 100 + streakBonus;
        setScore(prev => prev + pointsEarned);
        setStreak(prev => prev + 1);
        const position = getClickPosition();
        showFloatingScore(pointsEarned, position.x, position.y);

        setTiles(prev => prev.map(tile => 
          tile.id === firstId || tile.id === secondId
            ? { ...tile, isMatched: true }
            : tile
        ));
        setFlippedTiles([]);
        setIsChecking(false);
      } else {
        setScore(prev => Math.max(0, prev - 50));
        setStreak(0);
        const position = getClickPosition();
        showFloatingScore(-50, position.x, position.y);

        setTimeout(() => {
          setFlippedTiles([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const isGameComplete = tiles.every(tile => tile.isMatched);

  return (
    <div className="min-h-screen bg-[#F2F3F0] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-12 relative w-full max-w-md">
      <Analytics />
        <h1 className="text-4xl font-bold text-[#2F3327] mb-3">Zen Match</h1>
        <p className="text-[#5C6355] text-lg">A calming memory game designed for quick mental breaks</p>
        
        <button
          onClick={() => setShowHowToPlay(true)}
          className="absolute right-0 top-0 p-2 text-[#5C6355] hover:text-[#2F3327] transition-colors"
          aria-label="How to Play"
        >
          <Info className="w-6 h-6" />
        </button>
      </div>

      {/* Score Display */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center text-[#5C6355]">
        <div className="flex items-center gap-4">
          <div className="text-lg">
            Score: <span className="font-bold">{score}</span>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-lg">Streak: {streak}</span>
              <span className="text-xl">🔥</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8">
        <div className="h-2 bg-[#E5E7E1] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#8B9B7E] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Floating Score Animation */}
      {showScorePopup && (
        <div
          className={`fixed pointer-events-none transition-all duration-1000 transform -translate-y-16 opacity-0`}
          style={{
            left: showScorePopup.x - 20,
            top: showScorePopup.y - 20,
            color: showScorePopup.score > 0 ? '#4CAF50' : '#F44336',
          }}
        >
          {showScorePopup.score > 0 ? '+' : ''}{showScorePopup.score}
        </div>
      )}

      {/* Game Grid */}
      <div className="grid grid-cols-4 gap-4 max-w-md w-full">
        {tiles.map(tile => (
          <button
            key={tile.id}
            onClick={() => handleTileClick(tile.id)}
            className={`aspect-square rounded-2xl text-4xl flex items-center justify-center transition-all duration-500 transform ${
              tile.isFlipped || tile.isMatched || flippedTiles.includes(tile.id)
                ? 'bg-white shadow-md rotate-0'
                : 'bg-[#E5E7E1] rotate-180'
            } ${
              tile.isMatched ? 'opacity-60' : ''
            } hover:scale-105 active:scale-95`}
            disabled={tile.isMatched}
          >
            <span className={`transition-all duration-500 ${
              tile.isFlipped || tile.isMatched || flippedTiles.includes(tile.id)
                ? 'rotate-0 opacity-100'
                : 'rotate-180 opacity-0'
            }`}>
              {tile.emoji}
            </span>
          </button>
        ))}
      </div>

      {/* Play Again Button */}
      {isGameComplete && (
        <div className="mt-8">
          <button
            onClick={initializeGame}
            className="px-8 py-3 bg-[#8B9B7E] text-white rounded-full font-medium hover:bg-[#7A8A6D] transition-colors shadow-md text-lg"
          >
            Play Again
          </button>
        </div>
      )}

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-xl">
            <button
              onClick={() => setShowHowToPlay(false)}
              className="absolute right-6 top-6 text-[#5C6355] hover:text-[#2F3327]"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-[#2F3327] mb-6">How to Play</h2>
            
            <div className="space-y-4 text-[#5C6355]">
              <p>1. Click any tile to reveal an emoji</p>
              <p>2. Click another tile to find its matching pair</p>
              <p>3. If the emojis match, they'll stay revealed</p>
              <p>4. If they don't match, both tiles will flip back</p>
              <p>5. Match all pairs to complete the game</p>
              <p>6. Track your progress with the bar above the grid</p>
              <p className="text-[#8B9B7E] italic mt-6">
                Each new game features a fresh set of nature-themed emojis!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Final Score Modal */}
      {showFinalScore && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-xl text-center">
            <h2 className="text-3xl font-bold text-[#2F3327] mb-6">Game Complete! 🎉</h2>
            
            <div className="space-y-4 text-[#5C6355] mb-8">
              <div className="text-4xl font-bold text-[#8B9B7E]">
                Final Score: {score}
              </div>
              <div className="text-lg">
                Highest Streak: {streak} 🔥
              </div>
            </div>

            <button
              onClick={initializeGame}
              className="px-8 py-3 bg-[#8B9B7E] text-white rounded-full font-medium hover:bg-[#7A8A6D] transition-colors shadow-md text-lg w-full max-w-xs"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Compass, Sparkles, MapPin, Calendar, Clock, DollarSign } from 'lucide-react';

export interface DestinationChapter {
  id: string;
  chapterNumber: string;
  destination: string;
  country: string;
  tagline: string;
  quote: string;
  quoteAuthor: string;
  description: string;
  image: string;
  coordinates: string;
  optimalSeason: string;
  avgDailyCost: string;
  vibe: string;
  associatedTripId?: string;
  highlights: string[];
}

export const DESTINATION_CHAPTERS: DestinationChapter[] = [
  {
    id: 'varanasi',
    chapterNumber: '01',
    destination: 'VARANASI',
    country: 'Uttar Pradesh, India',
    tagline: 'The Sacred City of Light & Timeless Ganges Dawn Rituals',
    quote: 'Varanasi is older than history, older than tradition, older even than legend, and looks twice as old as all of them put together.',
    quoteAuthor: 'Mark Twain',
    description: 'Drift along the sacred Ganges at dawn as the morning sun illuminates ancient sandstone temple spires. Experience the hypnotic resonance of evening Maha Aarti at Dashashwamedh Ghat and wander through fragrant spiritual alleyways.',
    image: '/src/assets/images/hero_varanasi_ghats_1792578896259.jpg',
    coordinates: '25.3176° N, 82.9739° E',
    optimalSeason: 'Oct - Mar · Pleasant Winter',
    avgDailyCost: '₹2,400 / day',
    vibe: 'Spiritual Eternity & Ancient Mysticism',
    highlights: ['Subah-e-Banaras Boat Ride', 'Dashashwamedh Maha Aarti', 'Kashi Vishwanath Corridor', 'Banarasi Silk Weavers'],
  },
  {
    id: 'ladakh',
    chapterNumber: '02',
    destination: 'LADAKH',
    country: 'Himalayas, India',
    tagline: 'The Land of High Passes & Turquoise Glacial Lakes',
    quote: 'In the sacred silence of the Himalayas, the mountains do not simply speak; they reveal the quiet immensity within.',
    quoteAuthor: 'Himalayan Travel Wisdom',
    description: 'Cross the world’s highest motorable passes into a lunar high-altitude realm. Camp beneath star-dusted skies beside the ever-shifting turquoise waters of Pangong Tso and explore ancient Tibetan gompas clinging to sheer granite cliffs.',
    image: '/src/assets/images/hero_ladakh_pangong_1792578896067.jpg',
    coordinates: '34.1526° N, 77.5771° E',
    optimalSeason: 'May - Sep · Mountain Summer',
    avgDailyCost: '₹4,800 / day',
    vibe: 'Epic Himalayan High-Altitude Trekking',
    associatedTripId: 'trip_ladakh_2026',
    highlights: ['Pangong Tso Dome Camping', 'Nubra Valley Hunder Dunes', 'Khardung La Pass (17,982 ft)', 'Thiksey Morning Chants'],
  },
  {
    id: 'kerala',
    chapterNumber: '03',
    destination: 'KERALA',
    country: 'God’s Own Country, India',
    tagline: 'Emerald Tea Plantations & Silent Coconut Backwaters',
    quote: 'Where mist-clad Western Ghats touch the sky and silent palm waters cradle centuries of tranquil warmth.',
    quoteAuthor: 'Travancore Heritage Saying',
    description: 'Breathe crisp mountain air atop the world’s highest orthodox tea slopes in Munnar. Unwind aboard a handcrafted wooden Kettuvallam houseboat drifting along mirror-smooth palm backwaters as local fishermen cast Chinese fishing nets.',
    image: '/src/assets/images/hero_kerala_tea_1792578896389.jpg',
    coordinates: '10.0889° N, 77.0595° E',
    optimalSeason: 'Sep - Mar · Tropical Winter',
    avgDailyCost: '₹3,600 / day',
    vibe: 'God’s Own Tropical Serenity',
    associatedTripId: 'trip_kerala_2026',
    highlights: ['Overnight Houseboat Cruise', 'Kolukkumalai Sunrise 4x4', 'Ayurvedic Spice Gardens', 'Kathakali Art Traditions'],
  },
  {
    id: 'udaipur',
    chapterNumber: '04',
    destination: 'UDAIPUR',
    country: 'Rajasthan, India',
    tagline: 'The Crown Jewel of Mewar Royalty & Marble Lake Palaces',
    quote: 'Every marble arch, jharokha balcony, and sunset reflection on Lake Pichola whispers legends of Rajput valor and romance.',
    quoteAuthor: 'Mewar Court Chronicle',
    description: 'Surrender to the romantic splendour of Rajasthan. Sail past floating white marble palaces on Lake Pichola, marvel at 400 years of royal Mewar heritage in the City Palace, and savor rich Dal Baati Churma under palace jharokhas.',
    image: '/src/assets/images/hero_udaipur_palace_1792578896382.jpg',
    coordinates: '24.5854° N, 73.7125° E',
    optimalSeason: 'Oct - Mar · Royal Winter',
    avgDailyCost: '₹4,200 / day',
    vibe: 'Royal Rajput Splendor & Romance',
    associatedTripId: 'trip_rajasthan_2026',
    highlights: ['Lake Pichola Sunset Boating', 'City Palace Peacock Courtyard', 'Bagore Ki Haveli Folk Show', 'Monsoon Palace Panorama'],
  },
  {
    id: 'goa',
    chapterNumber: '05',
    destination: 'GOA',
    country: 'Arabian Sea Coast, India',
    tagline: 'Golden Palm Shores, Portuguese Heritage & Susegad Coastal Bliss',
    quote: 'In Goa, time does not merely pass; it washes ashore like gentle turquoise tides and stays for sunset.',
    quoteAuthor: 'Coastal Susegad Philosophy',
    description: 'Bask in golden sunshine along serene southern beaches of Palolem and Agonda. Wander past vibrant pastel colonial villas in Fontainhas, discover 16th-century baroque churches in Old Goa, and indulge in authentic spice plantation feasts.',
    image: '/src/assets/images/hero_kerala_tea_1792578896389.jpg',
    coordinates: '15.2993° N, 74.1240° E',
    optimalSeason: 'Nov - Feb · Coastal Breeze',
    avgDailyCost: '₹3,800 / day',
    vibe: 'Susegad & Coastal Relaxation',
    highlights: ['Palolem Crescent Bay', 'Basilica of Bom Jesus', 'Fontainhas Latin Quarter', 'Spice Plantation Feast'],
  },
];

interface LandingHeroProps {
  onPlanTrip: (destinationId?: string, tripId?: string) => void;
  onExploreCatalog: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onPlanTrip, onExploreCatalog }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const current = DESTINATION_CHAPTERS[currentIndex];

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % DESTINATION_CHAPTERS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % DESTINATION_CHAPTERS.length);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + DESTINATION_CHAPTERS.length) % DESTINATION_CHAPTERS.length);
  };

  return (
    <div className="relative w-full h-[90vh] min-h-[640px] max-h-[960px] overflow-hidden bg-[#0b0f17] select-none">
      
      {/* Background Image Layer with Crossfade & Slow Scale Zoom */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0"
        >
          <img
            src={current.image}
            alt={current.destination}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          
          {/* Subtle Parallax Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f17]/85 via-[#0b0f17]/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Main Content Layout */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-between py-8">
        
        {/* Top Meta Header: Coordinates & Season */}
        <div className="flex items-center justify-between text-xs font-mono tracking-wider text-slate-300">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10 text-emerald-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CHAPTER {current.chapterNumber} OF 05</span>
            </span>
            <span className="hidden sm:inline text-slate-400">{current.coordinates}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{current.optimalSeason}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-white/10 px-2 py-0.5 rounded backdrop-blur-md border border-white/10">
              <span>{current.avgDailyCost}</span>
            </span>
          </div>
        </div>

        {/* Center: Hero Typography & Cinematic Content */}
        <div className="max-w-2xl space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* Country & Tagline */}
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-mono tracking-widest text-emerald-400 uppercase font-semibold block">
                  {current.country}
                </span>
                <p className="text-xs sm:text-sm font-serif italic text-slate-300 tracking-wide">
                  "{current.tagline}"
                </p>
              </div>

              {/* Massive Editorial Destination Title */}
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif font-black tracking-tight text-white leading-none drop-shadow-lg">
                {current.destination}
              </h1>

              {/* Narrative Quote */}
              <blockquote className="border-l-2 border-emerald-400 pl-4 py-1 text-slate-300 text-xs sm:text-sm italic leading-relaxed max-w-xl">
                "{current.quote}"
                <footer className="text-[11px] font-mono font-medium text-emerald-400/90 not-italic mt-1">
                  — {current.quoteAuthor}
                </footer>
              </blockquote>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-lg hidden sm:block">
                {current.description}
              </p>

              {/* Highlights Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {current.highlights.map((h) => (
                  <span
                    key={h}
                    className="text-[11px] font-medium text-slate-200 bg-white/10 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-md"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onPlanTrip(current.id, current.associatedTripId)}
              className="px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02]"
            >
              <span>Plan This Indian Journey</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreCatalog}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm backdrop-blur-md border border-white/15 transition-all cursor-pointer flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Browse All Cities</span>
            </button>
          </div>
        </div>

        {/* Bottom Navigation & Chapter Thumbnails */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
          
          {/* Chapter Selector Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {DESTINATION_CHAPTERS.map((chap, idx) => (
              <button
                key={chap.id}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(idx);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  currentIndex === idx
                    ? 'bg-emerald-400 text-slate-950 font-bold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <span>{chap.chapterNumber}</span>
                <span className="font-sans font-semibold tracking-wide">{chap.destination}</span>
              </button>
            ))}
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              title="Previous Chapter"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              title="Next Chapter"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

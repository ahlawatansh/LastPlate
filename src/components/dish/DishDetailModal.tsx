import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Share2,
  Heart,
  ShoppingBag,
  Clock,
  Flame,
  ChefHat,
  Plus,
  ThumbsUp,
  ChevronLeft,
} from 'lucide-react';
import { MenuItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface DishDetailModalProps {
  dish: MenuItem | null;
  onClose: () => void;
}

const DISH_REVIEWS: Record<string, { id: string; user: string; text: string; time: string; likes: number }[]> = {
  'item-1': [
    {
      id: 'r-1-1',
      user: 'Tanvi Roy',
      text: 'The char on the paneer tikka gives it an incredible smoky tandoori flavor. The laccha paratha stays soft and never greasy!',
      time: '2 hours ago',
      likes: 82,
    },
    {
      id: 'r-1-2',
      user: 'Varun Kapoor',
      text: 'Best kathi roll in Indiranagar, Bengaluru. The pickled laccha onions and tangy mint chutney ratio is absolute perfection.',
      time: 'Yesterday',
      likes: 145,
    },
    {
      id: 'r-1-3',
      user: 'Megha Soni',
      text: 'Ordered this twice this week already. Generous cottage cheese portions and zero excess oil. Steaming hot delivery.',
      time: '3 days ago',
      likes: 67,
    },
  ],
  'item-2': [
    {
      id: 'r-2-1',
      user: 'Aman Verma',
      text: 'The makhani gravy coating the smoked soya chaap is so rich and buttery! You would mistake it for luxury dining.',
      time: '3 hours ago',
      likes: 94,
    },
    {
      id: 'r-2-2',
      user: 'Ritika Sen',
      text: 'Super juicy texture with subtle fenugreek aroma. Loved the crisp onion crunch folded into every bite.',
      time: 'Yesterday',
      likes: 58,
    },
    {
      id: 'r-2-3',
      user: 'Kunal Singhal',
      text: 'Very filling protein bomb. Great alternative to meat rolls without heavy guilt.',
      time: '4 days ago',
      likes: 71,
    },
  ],
  'item-3': [
    {
      id: 'r-3-1',
      user: 'Kabir Anand',
      text: 'Real roasted garlic hummus and crispy exterior falafels! Clean, fiber-rich wrap that never leaves you bloated.',
      time: '5 hours ago',
      likes: 112,
    },
    {
      id: 'r-3-2',
      user: 'Sarah Jenkins',
      text: 'Authentic Mediterranean flavors with a fresh herb punch. The tahini mint drizzle ties it together gracefully.',
      time: '2 days ago',
      likes: 76,
    },
    {
      id: 'r-3-3',
      user: 'Ananya Joshi',
      text: 'Crunchy pickled cucumbers inside give that tart zest I always look for. Will re-order for lunch tomorrow.',
      time: '4 days ago',
      likes: 49,
    },
  ],
  'item-4': [
    {
      id: 'r-4-1',
      user: 'Rajesh Nambiar',
      text: 'You can clearly taste the 24-hour slow simmer. Silky, creamy black lentils without unnecessary synthetic cream.',
      time: '1 hour ago',
      likes: 210,
    },
    {
      id: 'r-4-2',
      user: 'Deepa Nair',
      text: 'Soul comfort in a bowl. Cumin rice is long-grain aged basmati and the sirka onions provide the ideal acidic contrast.',
      time: 'Yesterday',
      likes: 89,
    },
    {
      id: 'r-4-3',
      user: 'Gaurav Malik',
      text: 'Sublime culinary craft. Reminds me of traditional Punjab dhabas at their pinnacle.',
      time: '2 days ago',
      likes: 134,
    },
    {
      id: 'r-4-4',
      user: 'Neha Batra',
      text: 'Generous serving bowl. Arrived piping hot in eco-friendly sealed containers.',
      time: '5 days ago',
      likes: 42,
    },
  ],
  'item-5': [
    {
      id: 'r-5-1',
      user: 'Vikram Chauhan',
      text: 'Chunkier onion tomato gravy with grated paneer makes this so luxurious. Multigrain rotis were surprisingly soft.',
      time: '2 hours ago',
      likes: 78,
    },
    {
      id: 'r-5-2',
      user: 'Shweta Iyer',
      text: 'Nutrient-packed meal. The cashew finish is subtle and balanced, not sweet like regular takeout curries.',
      time: 'Yesterday',
      likes: 120,
    },
    {
      id: 'r-5-3',
      user: 'Karan Singhania',
      text: 'High protein thali combo. The rotis are wholesome and paneer triangles were fresh from today morning batch.',
      time: '3 days ago',
      likes: 65,
    },
  ],
  'item-6': [
    {
      id: 'r-6-1',
      user: 'Harpreet Singh',
      text: 'Jammu red rajma cooked to melt-in-mouth tenderness. Masala has ginger-garlic punch without being acidic.',
      time: '3 hours ago',
      likes: 168,
    },
    {
      id: 'r-6-2',
      user: 'Pooja Rastogi',
      text: 'Boondi raita was chilled and refreshing alongside the warm rajma pot. Absolute home food nostalgia.',
      time: 'Yesterday',
      likes: 93,
    },
    {
      id: 'r-6-3',
      user: 'Aditya Sharma',
      text: 'Feels like home-cooked food by mom. Low oil, great digestion, perfect comfort dinner.',
      time: '4 days ago',
      likes: 54,
    },
  ],
  'item-7': [
    {
      id: 'r-7-1',
      user: 'Natasha Grover',
      text: 'The subtle mist of white truffle essence combined with sweet chilled yogurt is revolutionary! Elite street food reinvention.',
      time: '30 mins ago',
      likes: 192,
    },
    {
      id: 'r-7-2',
      user: 'Rohan Bhasin',
      text: 'Crispy puries did not get soggy at all thanks to clever partition packing. Exceptional balance of tamarind and curd.',
      time: 'Yesterday',
      likes: 114,
    },
    {
      id: 'r-7-3',
      user: 'Ishita Gupta',
      text: 'All 6 pieces vanished within two minutes. Light, crisp, refreshing, and deeply aromatic.',
      time: '3 days ago',
      likes: 81,
    },
  ],
  'item-8': [
    {
      id: 'r-8-1',
      user: 'Devika Sengupta',
      text: 'Hass avocado richness paired with crisp whole-wheat papdi and pomegranate jewels is sheer culinary genius.',
      time: '2 hours ago',
      likes: 88,
    },
    {
      id: 'r-8-2',
      user: 'Yash Kulkarni',
      text: 'Modern cafe chaat at its peak. Tangy, crunchy, creamy, and wholesome all in one spoon.',
      time: 'Yesterday',
      likes: 73,
    },
  ],
  'item-9': [
    {
      id: 'r-9-1',
      user: 'Siddharth Roy',
      text: 'Baked samosas that don’t compromise on flaky crunch! Cashew and pea filling is spiced to perfection.',
      time: '1 hour ago',
      likes: 65,
    },
    {
      id: 'r-9-2',
      user: 'Preeti Saxena',
      text: 'Guilt-free evening chai partner. Zero heavy oil aftertaste and the mint coriander chutney is vibrant.',
      time: '2 days ago',
      likes: 104,
    },
    {
      id: 'r-9-3',
      user: 'Arjun Pillai',
      text: 'Trio was gone immediately. Crisp pastry without deep-frying makes a tremendous difference.',
      time: '4 days ago',
      likes: 41,
    },
  ],
  'item-10': [
    {
      id: 'r-10-1',
      user: 'Alok Tripathi',
      text: 'Clay kulhad infuses that signature earthy aroma. Real freshly crushed cardamom and fiery ginger warmth!',
      time: '45 mins ago',
      likes: 245,
    },
    {
      id: 'r-10-2',
      user: 'Sneha Rao',
      text: 'Arrived piping hot in heat-sealed spill-proof flask. Authentic Assam tea brew, neither overly milky nor weak.',
      time: 'Yesterday',
      likes: 178,
    },
    {
      id: 'r-10-3',
      user: 'Mohit Chopra',
      text: 'The gold standard of evening tea. Instant energy recharge after a long sprint of work.',
      time: '3 days ago',
      likes: 95,
    },
    {
      id: 'r-10-4',
      user: 'Divya M.',
      text: 'Pure whole cardamom pods and clean unrefined sweetener. Deliciously comforting.',
      time: '5 days ago',
      likes: 60,
    },
  ],
  'item-11': [
    {
      id: 'r-11-1',
      user: 'Sunita Bhalla',
      text: 'Chilled terracotta pot keeps it at the exact dessert temperature. Saffron aroma and chopped pistachios are royal.',
      time: '1 hour ago',
      likes: 142,
    },
    {
      id: 'r-11-2',
      user: 'Abhimanyu Bose',
      text: 'Not cloyingly sweet, perfectly balanced rabdi texture. Basmati grains ground to exact coarseness.',
      time: 'Yesterday',
      likes: 119,
    },
    {
      id: 'r-11-3',
      user: 'Kavita Rawat',
      text: 'Stunning end to our family dinner. The earthiness of the pot elevates it 10x.',
      time: '3 days ago',
      likes: 88,
    },
  ],
  'item-12': [
    {
      id: 'r-12-1',
      user: 'Nikhil Mathur',
      text: 'Warm molten chocolate core oozing out of a gulab jamun is food ecstasy. Absolute must-order!',
      time: '2 hours ago',
      likes: 160,
    },
    {
      id: 'r-12-2',
      user: 'Ritu Deshmukh',
      text: 'Innovative fusion dessert that actually works! Decadent, warm, and comforting.',
      time: 'Yesterday',
      likes: 131,
    },
    {
      id: 'r-12-3',
      user: 'Sameer Khan',
      text: 'Order this warm; the chocolate center with rose syrup essence is an explosion of flavours.',
      time: '4 days ago',
      likes: 75,
    },
  ],
};

function getDishReviews(dish: MenuItem) {
  if (dish.id && DISH_REVIEWS[dish.id]) {
    return DISH_REVIEWS[dish.id];
  }
  return [
    {
      id: `fallback-1-${dish.id}`,
      user: 'Aarav Patel',
      text: `Loved the freshness and flavor profile of ${dish.name}. Great portion size and very balanced seasoning.`,
      time: '3 hours ago',
      likes: 45,
    },
    {
      id: `fallback-2-${dish.id}`,
      user: 'Kavita Sen',
      text: `Arrived hot and fresh! Authentic ${dish.category} preparation with high quality ingredients. Highly recommend.`,
      time: 'Yesterday',
      likes: 82,
    },
    {
      id: `fallback-3-${dish.id}`,
      user: 'Rohan Das',
      text: `Delicious and wholesome. You can tell they use fresh produce and minimal excess oil.`,
      time: '3 days ago',
      likes: 29,
    },
  ];
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({ dish, onClose }) => {
  const { addToCart } = useApp();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(248);
  const [comments, setComments] = useState<{ id: string; user: string; text: string; time: string; likes: number }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    if (dish) {
      setComments(getDishReviews(dish));
      setIsLiked(false);
      setLikeCount(Math.floor(180 + (dish.price * 2) % 150));
    }
  }, [dish?.id, dish?.name]);

  if (!dish) return null;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      {
        id: Date.now().toString(),
        user: 'You (Verified Foodie)',
        text: newComment.trim(),
        time: 'Just now',
        likes: 0,
      },
      ...comments,
    ]);
    setNewComment('');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-pointer"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="p-2 sm:p-3 rounded-[36px] bg-white/50 backdrop-blur-sm max-w-5xl sm:max-w-6xl w-full cursor-default my-auto"
      >
        <div className="bg-white rounded-3xl w-full max-h-[82vh] overflow-hidden border border-slate-200 flex flex-col">
        {/* Top bar - Black & White Sleek Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white text-black shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-900 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="w-px h-5 bg-slate-200 hidden sm:block" />
            <div className="hidden sm:block">
              <h2 className="text-sm font-black text-black uppercase tracking-wider leading-none">Dish Explorer & Nutrition</h2>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{dish.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer relative"
              title="Share Dish"
            >
              <Share2 className="w-4 h-4" />
              {copiedNotification && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setIsLiked(!isLiked);
                setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
              }}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isLiked ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Save to favorites"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body with 2 Columns */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Left Column: Dish details, ingredients & recipe steps */}
          <div className="lg:col-span-8 p-6 sm:p-8 space-y-6">
            {/* Dish Hero Image & Quick Info */}
            <div className="relative rounded-3xl overflow-hidden aspect-video bg-slate-100 border border-slate-200/60">
              <img
                src={dish.imageUrl || 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80'}
                alt={dish.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#1B4332] text-[11px] font-bold uppercase tracking-wider">
                    {dish.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] font-bold">
                    {dish.category}
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black font-heading text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">
                  ₹{dish.price}
                </span>
              </div>
            </div>

            {/* Title & Metadata Pills */}
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                {dish.name}
              </h2>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-3 py-1 rounded-full bg-[#1B4332]/10 text-[#1B4332] font-bold border border-[#1B4332]/20">
                  Chef Special
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {dish.prepTimeMinutes || 20} min prep
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  380 kcal
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5 text-slate-500" />
                  Medium Craft
                </span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed pt-1">
                {dish.description}
              </p>

              {/* Nutrition breakdown pills (from Image 5) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs font-semibold text-slate-700 overflow-x-auto">
                <div className="text-center">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Carbs</span>
                  <span className="font-extrabold text-slate-900 text-sm">48g</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="text-center">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Protein</span>
                  <span className="font-extrabold text-[#1B4332] text-sm">18g</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="text-center">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Fats</span>
                  <span className="font-extrabold text-slate-900 text-sm">12g</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="text-center">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Fiber</span>
                  <span className="font-extrabold text-slate-900 text-sm">8g</span>
                </div>
              </div>
            </div>

            {/* Ingredients & Fresh Produce */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-heading">
                Ingredients & Fresh Produce
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {[
                  { name: 'Organic Paneer', qty: '120g' },
                  { name: 'Whole Wheat', qty: '80g' },
                  { name: 'Mint & Coriander', qty: '30g' },
                  { name: 'Desi Ghee', qty: '15ml' },
                  { name: 'Kashmiri Spices', qty: '10g' },
                  { name: 'Lemon & Chaat', qty: '1/2 pc' },
                ].map((ing, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center justify-center"
                  >
                    <span className="text-[10px] text-slate-500 font-semibold line-clamp-1">{ing.name}</span>
                    <span className="text-xs font-black text-slate-900 mt-0.5">{ing.qty}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comprehensive Nutritional & Health Wellness Profile */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-heading">
                Nutritional & Health Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-[#1B4332]/5 border border-[#1B4332]/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1B4332]">Macronutrient Balance</span>
                    <span className="text-[10px] font-semibold text-slate-500">Per Serving</span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span>Protein (Muscle Recovery)</span>
                      <strong className="text-zinc-900">18.4g (37% DV)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Dietary Fiber (Gut Health)</span>
                      <strong className="text-zinc-900">7.8g (31% DV)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Complex Carbohydrates</span>
                      <strong className="text-zinc-900">46.2g</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Healthy Unsaturated Fats</span>
                      <strong className="text-zinc-900">11.5g</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Micronutrients & Wellbeing</span>
                    <span className="text-[10px] font-semibold text-[#1B4332]">Certified Clean</span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span>Calcium & Vitamin B12</span>
                      <strong className="text-zinc-900">280mg / 1.8mcg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Dietary Iron & Magnesium</span>
                      <strong className="text-zinc-900">3.2mg / 68mg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Trans Fat & Artificial Colors</span>
                      <strong className="text-[#1B4332]">0.0g (Zero Added)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Glycemic Index Category</span>
                      <strong className="text-zinc-900">Low (Stable Energy)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Add to Cart Action */}
            <div className="pt-2">
              <button
                onClick={() => {
                  addToCart(dish);
                  onClose();
                }}
                className="w-full py-3.5 px-6 rounded-full bg-[#18181B] text-white font-extrabold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Basket · ₹{dish.price}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Customer Reviews & Social Comments (from Image 5) */}
          <div className="lg:col-span-4 p-6 sm:p-7 flex flex-col justify-between bg-slate-50/50">
            <div>
              <div className="pb-4 border-b border-slate-200">
                <h3 className="text-base font-extrabold text-slate-900 font-heading">
                  Reviews
                </h3>
              </div>

              {/* Comments List */}
              <div className="py-4 space-y-3.5 max-h-[500px] overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1B4332] text-white text-[10px] font-bold flex items-center justify-center">
                          {c.user.charAt(0)}
                        </div>
                        <span className="text-xs font-extrabold text-slate-900">{c.user}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{c.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.text}</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold pt-1">
                      <ThumbsUp className="w-3 h-3 text-slate-400" />
                      <span>{c.likes} helpful</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Comment Input Form (from Image 5) */}
            <form onSubmit={handleAddComment} className="mt-4 pt-3 border-t border-slate-200">
              <div className="relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your review or recipe note..."
                  className="w-full pl-4 pr-11 py-2.5 text-xs font-medium bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[#1B4332] text-white flex items-center justify-center hover:bg-[#143326] transition-all cursor-pointer active:scale-95 shadow-none"
                  title="Add note"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      </motion.div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Cpu,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateSuggestedForecast, INDIAN_FESTIVALS } from '../../services/historicalDataEngine';

interface ScheduleCalendarViewProps {
  mode?: 'RESTAURANT' | 'CUSTOMER';
  onSelectDish?: (dishName: string) => void;
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = () => {
  const { accuracyEvaluation, historyRecords, whatIfParams } = useApp();
  const dateScrollRef = useRef<HTMLDivElement>(null);

  const slidingDates = useMemo(() => {
    const days: { date: number; day: string; fullDate: string }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let d = 1; d <= 31; d++) {
      const dateStr = d < 10 ? `0${d}` : `${d}`;
      const dt = new Date(2026, 9, d);
      days.push({
        date: d,
        day: dayNames[dt.getDay()],
        fullDate: `2026-10-${dateStr}`,
      });
    }
    return days;
  }, []);

  const todayIndex = 11;
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(todayIndex);
  const [completedBatches, setCompletedBatches] = useState<Record<string, boolean>>({
    'batch-breakfast-2026-10-12': true,
    'batch-lunch-2026-10-12': true,
  });

  useEffect(() => {
    if (dateScrollRef.current) {
      const container = dateScrollRef.current;
      const todayEl = container.children[todayIndex] as HTMLElement;
      if (todayEl) {
        const offset = todayEl.offsetLeft - container.offsetWidth / 2 + todayEl.offsetWidth / 2;
        container.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
      }
    }
  }, [todayIndex]);

  const selectedDateObj = slidingDates[selectedDateIndex] || slidingDates[todayIndex];

  const { breakfastForecast, lunchForecast, eveningForecast, dinnerForecast, allPredictions } = useMemo(() => {
    const breakfast = calculateSuggestedForecast(historyRecords, selectedDateObj.fullDate, 'BREAKFAST', whatIfParams);
    const lunch = calculateSuggestedForecast(historyRecords, selectedDateObj.fullDate, 'LUNCH', whatIfParams);
    const evening = calculateSuggestedForecast(historyRecords, selectedDateObj.fullDate, 'EVENING', whatIfParams);
    const dinner = calculateSuggestedForecast(historyRecords, selectedDateObj.fullDate, 'DINNER', whatIfParams);

    return {
      breakfastForecast: breakfast,
      lunchForecast: lunch,
      eveningForecast: evening,
      dinnerForecast: dinner,
      allPredictions: [...breakfast, ...lunch, ...evening, ...dinner],
    };
  }, [historyRecords, selectedDateObj.fullDate, whatIfParams]);

  const dailyBatches = useMemo(() => {
    const topBreakfast = breakfastForecast.reduce((prev, curr) => (curr.expectedDemand > prev.expectedDemand ? curr : prev), breakfastForecast[0]);
    const topLunch = lunchForecast.reduce((prev, curr) => (curr.expectedDemand > prev.expectedDemand ? curr : prev), lunchForecast[0]);
    const topEvening = eveningForecast.reduce((prev, curr) => (curr.expectedDemand > prev.expectedDemand ? curr : prev), eveningForecast[0]);
    const topDinner = dinnerForecast.reduce((prev, curr) => (curr.expectedDemand > prev.expectedDemand ? curr : prev), dinnerForecast[0]);

    return [
      {
        id: `batch-breakfast-${selectedDateObj.fullDate}`,
        timeRange: '07:30 AM - 09:30 AM',
        title: 'Morning Breakfast & Chai Preparation',
        category: 'Breakfast' as const,
        dishName: topBreakfast ? topBreakfast.itemName : 'Signature Paneer Tikka Kathi Roll',
        prepQty: topBreakfast ? topBreakfast.suggestedPrepQty : 48,
        expectedDemand: topBreakfast ? topBreakfast.expectedDemand : 45,
        safetyBuffer: topBreakfast ? topBreakfast.safetyBufferQty : 3,
        accuracyScore: topBreakfast ? topBreakfast.confidenceScore : 95.8,
        description: topBreakfast?.keyDrivers?.[0] || 'Historical morning demand pattern with office commuter rush alignment.',
        isSurplus: false,
      },
      {
        id: `batch-lunch-${selectedDateObj.fullDate}`,
        timeRange: '11:45 AM - 02:30 PM',
        title: 'Peak Lunch Executive Thali & Rice Bowl Run',
        category: 'Lunch' as const,
        dishName: topLunch ? topLunch.itemName : 'Slow-Cooked Dal Makhani & Jeera Rice Bowl',
        prepQty: topLunch ? topLunch.suggestedPrepQty : 84,
        expectedDemand: topLunch ? topLunch.expectedDemand : 82,
        safetyBuffer: topLunch ? topLunch.safetyBufferQty : 2,
        accuracyScore: topLunch ? topLunch.confidenceScore : 94.6,
        description: topLunch?.keyDrivers?.[0] || 'High corporate lunch rush predicted from 3-year historical pattern.',
        isSurplus: false,
      },
      {
        id: `batch-snacks-${selectedDateObj.fullDate}`,
        timeRange: '04:30 PM - 06:15 PM',
        title: 'Evening Tea, Chaat & Snack Batches',
        category: 'Snacks' as const,
        dishName: topEvening ? topEvening.itemName : 'Truffle Dahi Puri (6 pcs) & Kulhad Chai',
        prepQty: topEvening ? topEvening.suggestedPrepQty : 35,
        expectedDemand: topEvening ? topEvening.expectedDemand : 34,
        safetyBuffer: topEvening ? topEvening.safetyBufferQty : 1,
        accuracyScore: topEvening ? topEvening.confidenceScore : 96.2,
        description: topEvening?.keyDrivers?.[0] || 'Evening tea break rush; street chaat and hot kulhad chai demand.',
        isSurplus: false,
      },
      {
        id: `batch-dinner-${selectedDateObj.fullDate}`,
        timeRange: '08:30 PM - 11:30 PM',
        title: 'Dinner Rush & Closing Dynamic Surplus Rescue',
        category: 'Surplus Rescue' as const,
        dishName: topDinner ? topDinner.itemName : 'Royal Paneer Makhani Thali (Surplus Reserved)',
        prepQty: topDinner ? topDinner.suggestedPrepQty : 65,
        expectedDemand: topDinner ? topDinner.expectedDemand : 58,
        safetyBuffer: topDinner ? topDinner.safetyBufferQty : 7,
        accuracyScore: topDinner ? topDinner.confidenceScore : 92.1,
        description: topDinner?.keyDrivers?.[0] || 'Evening dining surge; surplus portions auto-scheduled for rescue clearance after 9:45 PM.',
        isSurplus: true,
      },
    ];
  }, [breakfastForecast, lunchForecast, eveningForecast, dinnerForecast, selectedDateObj.fullDate]);

  const totalExpected = allPredictions.reduce((sum, p) => sum + p.expectedDemand, 0);
  const totalPrep = allPredictions.reduce((sum, p) => sum + p.suggestedPrepQty, 0);
  const totalSurplusReserve = allPredictions.reduce((sum, p) => sum + p.expectedWasteUnits, 0);
  const avgAccuracy = (
    allPredictions.reduce((sum, p) => sum + p.confidenceScore, 0) / Math.max(1, allPredictions.length)
  ).toFixed(1);

  const handleSlideLeft = () => {
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
    setSelectedDateIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSlideRight = () => {
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
    setSelectedDateIndex((prev) => Math.min(slidingDates.length - 1, prev + 1));
  };

  const toggleBatchCompletion = (batchId: string) => {
    setCompletedBatches((prev) => ({
      ...prev,
      [batchId]: !prev[batchId],
    }));
  };

  const targetFestival = INDIAN_FESTIVALS.find(
    (f) => f.month === 10 && f.day === selectedDateObj.date
  );

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#18181B] text-white flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-zinc-900 font-heading">
                Today's Production Schedule & AI Accuracy
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-900 font-extrabold uppercase tracking-wider">
                Restaurant Portal
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Compare today's scheduled kitchen menu against historical AI demand forecasts and model accuracy.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-zinc-900 px-3.5 py-1.5 rounded-full bg-zinc-100">
            October 2026
          </span>
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-full">
            <button
              type="button"
              onClick={handleSlideLeft}
              disabled={selectedDateIndex === 0}
              className="p-1.5 rounded-full text-zinc-700 hover:text-black hover:bg-white transition-colors cursor-pointer disabled:opacity-30"
              title="Slide Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSlideRight}
              disabled={selectedDateIndex === slidingDates.length - 1}
              className="p-1.5 rounded-full text-zinc-700 hover:text-black hover:bg-white transition-colors cursor-pointer disabled:opacity-30"
              title="Slide Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          ref={dateScrollRef}
          className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-2 scroll-smooth"
        >
          {slidingDates.map((item, index) => {
            const isSelected = selectedDateIndex === index;
            const isToday = index === todayIndex;

            return (
              <button
                key={item.fullDate}
                type="button"
                onClick={() => setSelectedDateIndex(index)}
                className={`rounded-3xl p-3 min-w-[64px] sm:min-w-[70px] text-center transition-all cursor-pointer border shrink-0 ${
                  isSelected
                    ? 'bg-black text-white border-black ring-2 ring-black'
                    : isToday
                    ? 'bg-[#1B4332]/10 text-[#1B4332] border-[#1B4332]/30 font-bold'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200/80'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isSelected
                      ? 'text-zinc-300'
                      : isToday
                      ? 'text-[#1B4332]'
                      : 'text-zinc-400'
                  }`}>
                    {item.day}
                  </span>
                </div>
                <span className="text-base sm:text-lg font-black block leading-none font-heading">
                  {item.date}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl p-5 sm:p-6 bg-zinc-50 border border-zinc-200/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/60">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-zinc-900" />
              <h3 className="text-sm font-extrabold text-zinc-900 font-heading">
                AI Accuracy Model Benchmark · {selectedDateObj.day}, Oct {selectedDateObj.date}
              </h3>
              {targetFestival && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">
                  {targetFestival.name}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Calculated using 3-year historical dining records, seasonal adjustments, and festival elasticities
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[#18181B] text-white text-xs sm:text-sm font-black flex items-center gap-2">
              <Percent className="w-4 h-4" /> Accuracy: {avgAccuracy}%
            </span>
            <span className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-zinc-200 text-zinc-800 text-xs sm:text-sm font-black flex items-center gap-2">
              Holdout WAPE: {accuracyEvaluation.weightedAbsolutePercentageError}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block font-heading">
              Predicted Demand
            </span>
            <span className="text-xl font-black text-zinc-900 font-heading block">
              {totalExpected} meals
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">Historical ML forecast</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block font-heading">
              Suggested Prep
            </span>
            <span className="text-xl font-black text-zinc-900 font-heading block">
              {totalPrep} meals
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">With buffer optimization</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block font-heading">
              Error Reduction
            </span>
            <span className="text-xl font-black text-[#1B4332] font-heading block">
              +{accuracyEvaluation.errorReductionVsBaseline}%
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">Vs 3-yr moving average</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block font-heading">
              Surplus Reserve
            </span>
            <span className="text-xl font-black text-zinc-900 font-heading block">
              {totalSurplusReserve} portions
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">Dynamic rescue clearance</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-zinc-900 font-heading">
            Daily Preparation Timeline & Menu Batches
          </h3>
          <span className="text-xs text-zinc-500 font-medium">
            {dailyBatches.filter((b) => completedBatches[b.id]).length} of {dailyBatches.length} batches completed
          </span>
        </div>

        <div className="divide-y divide-zinc-100 border-t border-b border-zinc-100">
          {dailyBatches.map((batch) => {
            const isDone = !!completedBatches[batch.id];

            return (
              <div
                key={batch.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleBatchCompletion(batch.id)}
                    className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      isDone
                        ? 'bg-[#18181B] text-white'
                        : 'border-2 border-zinc-300 text-transparent hover:border-black'
                    }`}
                    title={isDone ? 'Mark incomplete' : 'Mark batch prepared'}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-zinc-400 font-mono">
                        {batch.timeRange}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        batch.isSurplus
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {batch.category}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full">
                        Accuracy {batch.accuracyScore}%
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold text-zinc-900 font-heading ${
                      isDone ? 'line-through text-zinc-400' : ''
                    }`}>
                      {batch.dishName}
                    </h4>
                    <p className="text-xs text-zinc-500 line-clamp-1">
                      {batch.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pl-9 sm:pl-0">
                  <div className="text-right">
                    <span className="text-xs font-black text-zinc-900 block font-heading">
                      {batch.prepQty} portions to prep
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      (Demand: {batch.expectedDemand} + {batch.safetyBuffer} buffer)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleBatchCompletion(batch.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isDone
                        ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        : 'bg-[#18181B] text-white hover:bg-black'
                    }`}
                  >
                    {isDone ? 'Completed' : 'Mark Ready'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

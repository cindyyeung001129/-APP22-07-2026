import { useMemo, useState } from 'react';
import { CheckInRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { format, subDays, parseISO, getDay, isAfter } from 'date-fns';
import { TrendingUp, Smile, Frown, Calendar, Lightbulb } from 'lucide-react';

interface MoodTrendsViewProps {
  records: CheckInRecord[];
}

export default function MoodTrendsView({ records }: MoodTrendsViewProps) {
  const [timeRange, setTimeRange] = useState<'7days' | '30days'>('7days');

  const {
    chartData,
    moodDistribution,
    mostFrequentMood,
    positiveRatio,
    insights
  } = useMemo(() => {
    const now = new Date();
    const daysToLookBack = timeRange === '7days' ? 7 : 30;
    const startDate = subDays(now, daysToLookBack - 1);
    
    // Filter records within time range
    const recentRecords = records.filter(r => {
      try {
        const d = parseISO(r.date);
        return isAfter(d, subDays(startDate, 1));
      } catch (e) {
        return false;
      }
    });

    // 1. Chart Data (Count by day)
    const dataMap: Record<string, { dateStr: string, displayDate: string, positive: number, heavy: number }> = {};
    for (let i = 0; i < daysToLookBack; i++) {
      const d = subDays(now, daysToLookBack - 1 - i);
      const key = format(d, 'yyyy-MM-dd');
      dataMap[key] = {
        dateStr: key,
        displayDate: format(d, 'MM/dd'),
        positive: 0,
        heavy: 0
      };
    }

    recentRecords.forEach(r => {
      if (dataMap[r.date]) {
        if (r.moodType === 'positive') dataMap[r.date].positive += 1;
        else dataMap[r.date].heavy += 1;
      }
    });

    const chartData = Object.values(dataMap);

    // 2. Mood Distribution
    const distMap: Record<string, { name: string, count: number, emoji: string }> = {};
    let posCount = 0;
    let heavyCount = 0;

    recentRecords.forEach(r => {
      if (r.moodType === 'positive') posCount++;
      else heavyCount++;

      if (!distMap[r.moodLabel]) {
        distMap[r.moodLabel] = { name: r.moodLabel, count: 0, emoji: r.moodEmoji };
      }
      distMap[r.moodLabel].count += 1;
    });

    const moodDistribution = Object.values(distMap).sort((a, b) => b.count - a.count);
    const mostFrequentMood = moodDistribution.length > 0 ? moodDistribution[0] : null;
    const positiveRatio = recentRecords.length > 0 ? Math.round((posCount / recentRecords.length) * 100) : 0;

    // 3. Insights
    const insights: string[] = [];
    
    if (recentRecords.length === 0) {
      insights.push('最近還沒有打卡紀錄，開始記錄你的每一天吧！');
    } else {
      // Find which day of the week has the most heavy moods
      const dayOfWeekHeavy: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
      const dayOfWeekPositive: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
      
      recentRecords.forEach(r => {
        try {
          const day = getDay(parseISO(r.date));
          if (r.moodType === 'heavy') dayOfWeekHeavy[day]++;
          else dayOfWeekPositive[day]++;
        } catch (e) {}
      });

      const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      
      let maxHeavyDay = -1;
      let maxHeavyCount = 0;
      let maxPosDay = -1;
      let maxPosCount = 0;

      for (let i = 0; i < 7; i++) {
        if (dayOfWeekHeavy[i] > maxHeavyCount) {
          maxHeavyCount = dayOfWeekHeavy[i];
          maxHeavyDay = i;
        }
        if (dayOfWeekPositive[i] > maxPosCount) {
          maxPosCount = dayOfWeekPositive[i];
          maxPosDay = i;
        }
      }

      if (maxHeavyCount >= 2) {
        insights.push(`你似乎在「${days[maxHeavyDay]}」比較容易感到壓力或負面情緒。`);
      }
      if (maxPosCount >= 2) {
        insights.push(`「${days[maxPosDay]}」通常是你心情最好的一天！`);
      }

      if (positiveRatio >= 70) {
        insights.push('最近你的心情大部分都很不錯，繼續保持這個好狀態！');
      } else if (positiveRatio <= 30 && recentRecords.length >= 3) {
        insights.push('最近似乎遇到了一些低潮，記得多給自己一些休息的時間。');
      }
    }

    return {
      chartData,
      moodDistribution,
      mostFrequentMood,
      positiveRatio,
      insights
    };
  }, [records, timeRange]);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b'];

  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin pb-6">
      
      {/* Top Filter */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl border-2 border-brand-sand shadow-xs w-full shrink-0">
        <div className="flex gap-1.5 w-full">
          <button
            onClick={() => setTimeRange('7days')}
            className={`flex-1 flex flex-row items-center justify-center gap-1 text-xs py-2 rounded-xl border transition cursor-pointer font-bold active:scale-95 text-center ${
              timeRange === '7days'
                ? 'bg-brand-moss border-brand-moss text-white shadow-2xs'
                : 'bg-white border-brand-sand text-gray-600 hover:bg-brand-sand/30'
            }`}
          >
            最近 7 天
          </button>
          <button
            onClick={() => setTimeRange('30days')}
            className={`flex-1 flex flex-row items-center justify-center gap-1 text-xs py-2 rounded-xl border transition cursor-pointer font-bold active:scale-95 text-center ${
              timeRange === '30days'
                ? 'bg-brand-moss border-brand-moss text-white shadow-2xs'
                : 'bg-white border-brand-sand text-gray-600 hover:bg-brand-sand/30'
            }`}
          >
            最近 30 天
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-2xl border border-brand-sand shadow-sm flex flex-col justify-center items-center text-center">
          <div className="text-3xl mb-1">{mostFrequentMood ? mostFrequentMood.emoji : '⚪'}</div>
          <div className="text-xs text-gray-500 font-bold">最常出現的心情</div>
          <div className="text-sm font-black text-gray-800">{mostFrequentMood ? mostFrequentMood.name : '無'}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-brand-sand shadow-sm flex flex-col justify-center items-center text-center">
          <div className="text-3xl mb-1">{positiveRatio >= 50 ? '☀️' : '🌧️'}</div>
          <div className="text-xs text-gray-500 font-bold">正向情緒比例</div>
          <div className="text-sm font-black text-gray-800">{positiveRatio}%</div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 shadow-sm space-y-2">
          <div className="flex items-center gap-1.5 text-amber-700 font-bold text-sm">
            <Lightbulb className="w-4 h-4" />
            <h3>情緒小發現</h3>
          </div>
          <ul className="space-y-1.5">
            {insights.map((insight, idx) => (
              <li key={idx} className="text-xs text-amber-900 flex items-start gap-1.5">
                <span className="mt-0.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Daily Chart */}
      <div className="bg-white p-3.5 rounded-2xl border border-brand-sand shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-brand-sage" />
          心情趨勢圖
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                cursor={{ fill: '#f4f1ea' }}
              />
              <Bar dataKey="positive" name="正向心情" stackId="a" fill="#34d399" radius={[0, 0, 4, 4]} />
              <Bar dataKey="heavy" name="沉重心情" stackId="a" fill="#fb7185" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution */}
      {moodDistribution.length > 0 && (
        <div className="bg-white p-3.5 rounded-2xl border border-brand-sand shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <Smile className="w-4 h-4 text-brand-sage" />
            情緒分佈
          </h3>
          <div className="flex items-center">
            <div className="h-32 w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moodDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="count"
                    stroke="none"
                  >
                    {moodDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 pl-2 space-y-1.5 max-h-32 overflow-y-auto scrollbar-none">
              {moodDistribution.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-gray-700">{item.emoji} {item.name}</span>
                  </div>
                  <span className="font-bold text-gray-500">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

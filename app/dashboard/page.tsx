'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiMessageSquare, FiTrendingUp, FiClock, FiCalendar, FiArrowUp, FiArrowDown, FiRefreshCw } from 'react-icons/fi';

type TimePeriod = 'day' | 'week' | 'month';

interface AnalyticsData {
  totalChats: number;
  change: number;
  peakHour: string;
  peakDay: string;
  hourlyData: number[];
  dailyData: number[];
  weeklyData: number[];
  hourlyDistribution: { time: string; count: number; percentage: number }[];
  weeklyPerformance: number[];
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
const hourLabels = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return `${hour}${ampm}`;
});

export default function DashboardPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [isChartReady, setIsChartReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalChats: 0,
    change: 0,
    peakHour: 'N/A',
    peakDay: 'N/A',
    hourlyData: [],
    dailyData: [],
    weeklyData: [],
    hourlyDistribution: [
      { time: '9 AM - 12 PM', count: 0, percentage: 0 },
      { time: '12 PM - 3 PM', count: 0, percentage: 0 },
      { time: '3 PM - 6 PM', count: 0, percentage: 0 },
      { time: '6 PM - 9 PM', count: 0, percentage: 0 },
    ],
    weeklyPerformance: [0, 0, 0, 0, 0, 0, 0]
  });

  const fetchAnalytics = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const response = await fetch(`/api/dashboard-analytics?period=${timePeriod}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setAnalyticsData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    setIsLoading(true);
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    setIsChartReady(false);
    const timer = setTimeout(() => {
      setIsChartReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [timePeriod, analyticsData]);

  const getChartData = () => {
    switch (timePeriod) {
      case 'day':
        return { data: analyticsData.hourlyData.length > 0 ? analyticsData.hourlyData : Array(24).fill(0), labels: hourLabels };
      case 'week':
        return { data: analyticsData.dailyData.length > 0 ? analyticsData.dailyData : Array(7).fill(0), labels: dayLabels };
      case 'month':
        return { data: analyticsData.weeklyData.length > 0 ? analyticsData.weeklyData : Array(4).fill(0), labels: weekLabels };
    }
  };

  const chartInfo = getChartData();
  const maxValue = Math.max(...chartInfo.data, 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Conversation Volume Insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <FiRefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm">
            {(['day', 'week', 'month'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  timePeriod === period
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <p className="text-yellow-700 dark:text-yellow-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border-b-4 border-green-500">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <FiMessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-medium ${
              analyticsData.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {analyticsData.change >= 0 ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />}
              {Math.abs(analyticsData.change)}%
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
            {analyticsData.totalChats.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total Messages
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border-b-4 border-green-500">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <FiClock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-4">
            {analyticsData.peakHour}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Active Response Time
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border-b-4 border-green-500">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <FiCalendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
            {analyticsData.peakDay}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Busiest Day
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border-b-4 border-green-500">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <FiTrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
            {analyticsData.change >= 0 ? '+' : ''}{analyticsData.change}%
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            User Engagement
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Conversation Volume
        </h2>
        
        <div ref={chartRef} className="h-64 sm:h-80 relative">
          <div className="absolute inset-0 flex gap-1 sm:gap-2 items-end pb-8">
            {chartInfo.data.map((value, index) => {
              const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className={`w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg cursor-pointer relative group min-w-[4px] sm:min-w-[8px] transition-all duration-500 hover:from-blue-700 hover:to-blue-500`}
                    style={{ 
                      height: isChartReady ? `${heightPercent}%` : '0%',
                      minHeight: isChartReady && value > 0 ? '4px' : '0px'
                    }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {value} chats
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex gap-1 sm:gap-2">
            {chartInfo.labels.map((label, index) => {
              const showLabel = timePeriod === 'day' 
                ? index % 4 === 0 
                : true;
              return (
                <div key={index} className="flex-1 text-center">
                  <span className={`text-xs text-gray-500 dark:text-gray-400 ${showLabel ? 'block' : 'hidden sm:block'}`}>
                    {timePeriod === 'day' && !showLabel ? '' : label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Hourly Distribution
          </h2>
          <div className="space-y-3">
            {analyticsData.hourlyDistribution.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{item.time}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{item.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Weekly Performance
          </h2>
          <div className="space-y-3">
            {dayLabels.map((day, index) => {
              const value = analyticsData.weeklyPerformance[index] || 0;
              const isHighest = value === Math.max(...analyticsData.weeklyPerformance);
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-12 text-sm text-gray-600 dark:text-gray-400">{day}</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHighest && value > 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-medium text-gray-900 dark:text-white">
                    {value}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

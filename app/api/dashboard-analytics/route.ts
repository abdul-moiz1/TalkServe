import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

interface ChatExperience {
  created_at: FirebaseFirestore.Timestamp | { seconds: number; nanoseconds: number } | string;
  customer_mood?: string;
  type?: string;
}

function getDateFromTimestamp(timestamp: ChatExperience['created_at']): Date {
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return new Date();
}

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousEndDate = new Date(startDate);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(startDate);
        break;
      case 'week':
      default:
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        previousEndDate = new Date(startDate);
        break;
    }

    const chatExperienceRef = db.collection('chatExperience');
    const currentPeriodSnapshot = await chatExperienceRef.get();
    
    const allChats: ChatExperience[] = [];
    currentPeriodSnapshot.forEach(doc => {
      allChats.push(doc.data() as ChatExperience);
    });

    const currentPeriodChats = allChats.filter(chat => {
      const chatDate = getDateFromTimestamp(chat.created_at);
      return chatDate >= startDate && chatDate <= now;
    });

    const previousPeriodChats = allChats.filter(chat => {
      const chatDate = getDateFromTimestamp(chat.created_at);
      return chatDate >= previousStartDate && chatDate < previousEndDate;
    });

    const totalChats = currentPeriodChats.length;
    const previousTotal = previousPeriodChats.length;
    const change = previousTotal > 0 
      ? ((totalChats - previousTotal) / previousTotal) * 100 
      : totalChats > 0 ? 100 : 0;

    const hourCounts: { [hour: number]: number } = {};
    const dayCounts: { [day: number]: number } = {};
    const moodCounts: { [mood: string]: number } = {};
    const typeCounts: { [type: string]: number } = {};

    currentPeriodChats.forEach(chat => {
      const chatDate = getDateFromTimestamp(chat.created_at);
      
      const hour = chatDate.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      
      const day = chatDate.getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
      
      if (chat.customer_mood) {
        moodCounts[chat.customer_mood] = (moodCounts[chat.customer_mood] || 0) + 1;
      }
      
      if (chat.type) {
        typeCounts[chat.type] = (typeCounts[chat.type] || 0) + 1;
      }
    });

    let peakHour = 0;
    let maxHourCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHour = parseInt(hour);
      }
    }

    const formatHour = (hour: number) => {
      const h = hour % 12 || 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      return `${h}:00 ${ampm}`;
    };

    const peakHourRange = maxHourCount > 0 
      ? `${formatHour(peakHour)} - ${formatHour((peakHour + 1) % 24)}`
      : 'N/A';

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let peakDay = 'N/A';
    let maxDayCount = 0;
    for (const [day, count] of Object.entries(dayCounts)) {
      if (count > maxDayCount) {
        maxDayCount = count;
        peakDay = dayNames[parseInt(day)];
      }
    }

    let hourlyData: number[] = [];
    let dailyData: number[] = [];
    let weeklyData: number[] = [];

    if (period === 'day') {
      hourlyData = Array.from({ length: 24 }, (_, i) => hourCounts[i] || 0);
    } else if (period === 'week') {
      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      dailyData = [1, 2, 3, 4, 5, 6, 0].map(day => dayCounts[day] || 0);
    } else if (period === 'month') {
      const weeksInMonth = Math.ceil((now.getDate()) / 7);
      weeklyData = Array(weeksInMonth).fill(0);
      
      currentPeriodChats.forEach(chat => {
        const chatDate = getDateFromTimestamp(chat.created_at);
        const weekIndex = Math.floor((chatDate.getDate() - 1) / 7);
        if (weekIndex < weeklyData.length) {
          weeklyData[weekIndex]++;
        }
      });
    }

    const hourlyDistribution = [
      { time: '9 AM - 12 PM', count: 0 },
      { time: '12 PM - 3 PM', count: 0 },
      { time: '3 PM - 6 PM', count: 0 },
      { time: '6 PM - 9 PM', count: 0 },
    ];

    currentPeriodChats.forEach(chat => {
      const chatDate = getDateFromTimestamp(chat.created_at);
      const hour = chatDate.getHours();
      
      if (hour >= 9 && hour < 12) hourlyDistribution[0].count++;
      else if (hour >= 12 && hour < 15) hourlyDistribution[1].count++;
      else if (hour >= 15 && hour < 18) hourlyDistribution[2].count++;
      else if (hour >= 18 && hour < 21) hourlyDistribution[3].count++;
    });

    const totalInRange = hourlyDistribution.reduce((sum, h) => sum + h.count, 0);
    const hourlyDistributionWithPercentage = hourlyDistribution.map(h => ({
      ...h,
      percentage: totalInRange > 0 ? Math.round((h.count / totalInRange) * 100) : 0
    }));

    const weeklyPerformance = [1, 2, 3, 4, 5, 6, 0].map(day => {
      const count = dayCounts[day] || 0;
      const maxCount = Math.max(...Object.values(dayCounts), 1);
      return Math.round((count / maxCount) * 100);
    });

    return NextResponse.json({
      success: true,
      data: {
        totalChats,
        change: Math.round(change * 10) / 10,
        peakHour: peakHourRange,
        peakDay,
        hourlyData,
        dailyData,
        weeklyData,
        moodCounts,
        typeCounts,
        hourlyDistribution: hourlyDistributionWithPercentage,
        weeklyPerformance
      }
    });

  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

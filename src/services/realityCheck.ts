import { 
  Trip, 
  TripStop, 
  ScheduledActivity, 
  Expense, 
  RealityCheckIssue,
  formatINR
} from '../types/travel';

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(mins: number): string {
  const normalized = Math.max(0, Math.min(1439, mins));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function runTripRealityCheck(
  trip: Trip,
  stops: TripStop[],
  activities: ScheduledActivity[],
  expenses: Expense[]
): {
  issues: RealityCheckIssue[];
  feasibilityScore: number; // 0 - 100
  metrics: {
    totalCost: number;
    budget: number;
    budgetDelta: number;
    isOverBudget: boolean;
    totalActivities: number;
    busiestDay: { date: string; hours: number; count: number } | null;
    conflictCount: number;
  };
} {
  const issues: RealityCheckIssue[] = [];

  // Group activities by date
  const activitiesByDate: Record<string, ScheduledActivity[]> = {};
  activities.forEach((act) => {
    if (!activitiesByDate[act.date]) {
      activitiesByDate[act.date] = [];
    }
    activitiesByDate[act.date].push(act);
  });

  // Calculate costs
  const activitiesCost = activities.reduce((sum, a) => sum + (a.cost || 0), 0);
  const expensesCost = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalCost = activitiesCost + expensesCost;
  const budgetDelta = totalCost - trip.total_budget;
  const isOverBudget = budgetDelta > 0;

  // 1. CHECK OVERLAPPING ACTIVITIES (Same day)
  let conflictCount = 0;
  Object.entries(activitiesByDate).forEach(([date, dayActs]) => {
    // Sort by start_time
    const sorted = [...dayActs].sort(
      (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const actA = sorted[i];
      const actB = sorted[i + 1];

      const endA = timeToMinutes(actA.end_time);
      const startB = timeToMinutes(actB.start_time);

      if (startB < endA) {
        // Direct overlap!
        conflictCount++;
        const overlapMins = endA - startB;
        const durationB = timeToMinutes(actB.end_time) - startB;
        const newStartB = endA + 30; // 30 min buffer
        const newEndB = newStartB + Math.max(30, durationB);

        issues.push({
          id: `issue_overlap_${actA.id}_${actB.id}`,
          type: 'overlap',
          severity: 'critical',
          title: `Schedule Overlap: ${actA.activity_title} & ${actB.activity_title}`,
          description: `"${actA.activity_title}" (${actA.start_time} - ${actA.end_time}) directly overlaps with "${actB.activity_title}" (${actB.start_time} - ${actB.end_time}) by ${overlapMins} mins on ${date}.`,
          affected_date: date,
          affected_activity_ids: [actA.id, actB.id],
          suggested_fix: {
            label: `Shift "${actB.activity_title}" to ${minutesToTime(newStartB)} - ${minutesToTime(newEndB)}`,
            explanation: `Pushes start time 30 minutes after ${actA.activity_title} completes, resolving the collision and allowing time for local commute.`,
            action_type: 'shift_time',
            payload: {
              activityId: actB.id,
              newStartTime: minutesToTime(newStartB),
              newEndTime: minutesToTime(newEndB),
            },
          },
        });
      } else if (startB - endA < 30 && actA.location_zone && actB.location_zone && actA.location_zone !== actB.location_zone) {
        // Distinct zones with insufficient transit buffer
        const gap = startB - endA;
        const recommendedBuffer = 45;
        const shiftBy = recommendedBuffer - gap;
        const durationB = timeToMinutes(actB.end_time) - startB;
        const newStartB = startB + shiftBy;
        const newEndB = newStartB + durationB;

        issues.push({
          id: `issue_transit_${actA.id}_${actB.id}`,
          type: 'transit_buffer',
          severity: 'warning',
          title: `Tight Transit Window: ${actA.location_zone} → ${actB.location_zone}`,
          description: `Only ${gap} mins allocated between "${actA.activity_title}" and "${actB.activity_title}". Indian city traffic between these districts typically requires at least 45 minutes by auto-rickshaw or taxi.`,
          affected_date: date,
          affected_activity_ids: [actA.id, actB.id],
          suggested_fix: {
            label: `Add 30-min buffer: Shift "${actB.activity_title}" to ${minutesToTime(newStartB)} - ${minutesToTime(newEndB)}`,
            explanation: `Inserts adequate transit buffer between distinct districts to avoid missing your entry slot or booking.`,
            action_type: 'shift_time',
            payload: {
              activityId: actB.id,
              newStartTime: minutesToTime(newStartB),
              newEndTime: minutesToTime(newEndB),
            },
          },
        });
      }
    }
  });

  // 2. CHECK INDIAN SACRED TIMINGS & GANGA AARTI TIMINGS
  activities.forEach((act) => {
    const titleLower = act.activity_title.toLowerCase();
    const zoneLower = (act.location_zone || '').toLowerCase();

    // Check 2a: Varanasi / Haridwar Ganga Aarti conflict
    // If activity is in Varanasi ghats in the evening but not the Aarti itself, or conflicts with Maha Aarti window (18:30 - 19:45)
    if (zoneLower.includes('ghat') || titleLower.includes('ghat') || zoneLower.includes('varanasi')) {
      const startM = timeToMinutes(act.start_time);
      const endM = timeToMinutes(act.end_time);
      const isAarti = titleLower.includes('aarti') || titleLower.includes('subah-e-banaras');

      if (!isAarti && startM < 1945 && endM > 1830) {
        issues.push({
          id: `issue_aarti_${act.id}`,
          type: 'temple_timing_conflict',
          severity: 'warning',
          title: `Ganga Aarti Crowding Conflict: ${act.activity_title}`,
          description: `Scheduled during the world-renowned Dashashwamedh Maha Aarti (18:30 - 19:45). The ghats and riverbanks will be intensely packed with thousands of pilgrims, making ordinary transit or dining difficult.`,
          affected_date: act.date,
          affected_activity_ids: [act.id],
          suggested_fix: {
            label: `Reserve Aarti Boat at 18:00 or move activity to 20:15`,
            explanation: `Reschedules this activity after the sacred Aarti concludes so you can immerse in the ceremonies peacefully.`,
            action_type: 'shift_time',
            payload: {
              activityId: act.id,
              newStartTime: '20:15',
              newEndTime: '21:45',
            },
          },
        });
      }
    }

    // Check 2b: Afternoon Temple Kapaat (Sanctum) Closure (12:30 PM - 16:00 PM)
    if (titleLower.includes('temple') || titleLower.includes('darshan') || titleLower.includes('mandir')) {
      const startM = timeToMinutes(act.start_time);
      const endM = timeToMinutes(act.end_time);

      if (startM >= 750 && endM <= 960) { // between 12:30 and 16:00
        issues.push({
          id: `issue_temple_kapaat_${act.id}`,
          type: 'temple_timing_conflict',
          severity: 'critical',
          title: `Temple Closed for Afternoon Bhog: ${act.activity_title}`,
          description: `Scheduled at ${act.start_time} - ${act.end_time}. Major Indian heritage temples close their inner sanctum (garbhagriha) daily between 12:30 PM and 4:00 PM for deity rest and bhog offerings.`,
          affected_date: act.date,
          affected_activity_ids: [act.id],
          suggested_fix: {
            label: `Shift to Morning Darshan (08:30 - 10:30 AM)`,
            explanation: `Aligns your visit with morning aarti and open sanctum hours when lines move smoothly.`,
            action_type: 'adjust_darshan_window',
            payload: {
              activityId: act.id,
              newStartTime: '08:30',
              newEndTime: '10:30',
              titlePrefix: 'Auspicious Morning',
            },
          },
        });
      }
    }

    // Check 2c: Intercity Transit - Suggest Vande Bharat Express for long train legs
    if (act.category === 'Transit' && (titleLower.includes('train') || titleLower.includes('express') || titleLower.includes('transit'))) {
      if (!titleLower.includes('vande bharat') && !titleLower.includes('flight') && !titleLower.includes('airport')) {
        issues.push({
          id: `issue_vande_bharat_${act.id}`,
          type: 'irctc_transit_impossible',
          severity: 'suggestion',
          title: `Transit Upgrade Opportunity: ${act.activity_title}`,
          description: `High-speed Vande Bharat Express runs on this sector with ergonomic chair cars, panoramic windows, and onboard hot meals, saving 2.5 hours over regular express trains.`,
          affected_date: act.date,
          affected_activity_ids: [act.id],
          suggested_fix: {
            label: `Upgrade to Vande Bharat Express Chair Car (${act.start_time})`,
            explanation: `Reduces intercity transit fatigue and guarantees air-conditioned punctuality.`,
            action_type: 'swap_transit_vande_bharat',
            payload: {
              activityId: act.id,
              replacementTitle: 'Vande Bharat Express Premium Chair Car',
              newStartTime: act.start_time,
              newEndTime: minutesToTime(Math.max(60, timeToMinutes(act.end_time) - 90)),
              newCost: Math.round(act.cost * 1.25),
            },
          },
        });
      }
    }
  });

  // 3. SEASONAL CLIMATE & MONSOON HAZARDS
  stops.forEach((stop) => {
    const cityName = stop.city_name.toLowerCase();
    const arrMonth = parseInt(stop.arrival_date.split('-')[1], 10);

    // 3a. Ladakh in Winter (Nov - April)
    if (cityName.includes('ladakh') || cityName.includes('leh')) {
      if (arrMonth >= 11 || arrMonth <= 4) {
        issues.push({
          id: `issue_ladakh_winter_${stop.id}`,
          type: 'monsoon_weather_hazard',
          severity: 'critical',
          title: `Himalayan Winter Alert for ${stop.city_name}`,
          description: `Travel dates fall in winter (Month ${arrMonth}). High mountain passes (Khardung La, Chang La to Pangong Tso) regularly freeze with temperatures plunging to -25°C. Overland passes from Manali/Srinagar will be completely blocked.`,
          affected_date: stop.arrival_date,
        });
      }
    }

    // 3b. Kerala Backwaters / Western Ghats during Peak Monsoon (June - August)
    if (cityName.includes('kerala') || cityName.includes('alleppey') || cityName.includes('munnar')) {
      if (arrMonth >= 6 && arrMonth <= 8) {
        issues.push({
          id: `issue_kerala_monsoon_${stop.id}`,
          type: 'monsoon_weather_hazard',
          severity: 'warning',
          title: `Heavy South-West Monsoon Alert for ${stop.city_name}`,
          description: `Travel is scheduled during peak monsoon (Month ${arrMonth}). Heavy torrential rains often trigger waterlogging in backwaters, suspension of houseboat navigation, and ghat road landslides in tea hills.`,
          affected_date: stop.arrival_date,
        });
      }
    }
  });

  // 4. CHECK OVERCROWDED DAYS / FATIGUE
  let maxDayHours = 0;
  let busiestDay: { date: string; hours: number; count: number } | null = null;

  Object.entries(activitiesByDate).forEach(([date, dayActs]) => {
    let dayTotalMins = 0;
    dayActs.forEach((a) => {
      const dur = Math.max(30, timeToMinutes(a.end_time) - timeToMinutes(a.start_time));
      dayTotalMins += dur;
    });

    const dayHours = dayTotalMins / 60;
    if (dayHours > maxDayHours) {
      maxDayHours = dayHours;
      busiestDay = { date, hours: Math.round(dayHours * 10) / 10, count: dayActs.length };
    }

    if (dayHours >= 8.5 || dayActs.length >= 6) {
      const candidateToMove = dayActs.find((a) => a.is_optional) || dayActs[dayActs.length - 2] || dayActs[dayActs.length - 1];
      const otherDates = Object.keys(activitiesByDate).filter((d) => d !== date && d >= trip.start_date && d <= trip.end_date);
      const lighterDate = otherDates.find((d) => activitiesByDate[d].length <= 2) || trip.end_date;

      issues.push({
        id: `issue_overcrowded_${date}`,
        type: 'overcrowded_day',
        severity: 'warning',
        title: `High Schedule Fatigue on ${date}`,
        description: `${dayActs.length} activities totaling ${Math.round(dayHours * 10) / 10} hours. Exploring in Indian climate with this density leaves zero buffer for chai stops, bazaar browsing, or rest.`,
        affected_date: date,
        affected_activity_ids: dayActs.map((a) => a.id),
        suggested_fix: candidateToMove
          ? {
              label: `Move "${candidateToMove.activity_title}" to ${lighterDate}`,
              explanation: `Balances your daily pacing by shifting an optional activity to a day with lighter scheduled load.`,
              action_type: 'move_to_day',
              payload: {
                activityId: candidateToMove.id,
                targetDate: lighterDate,
                newStartTime: '14:30',
                newEndTime: '16:00',
              },
            }
          : undefined,
      });
    }
  });

  // 5. DATE INCONSISTENCIES
  activities.forEach((act) => {
    if (act.date < trip.start_date || act.date > trip.end_date) {
      issues.push({
        id: `issue_date_range_${act.id}`,
        type: 'date_inconsistency',
        severity: 'critical',
        title: `Activity Outside Trip Dates: ${act.activity_title}`,
        description: `Scheduled for ${act.date}, but journey runs from ${trip.start_date} to ${trip.end_date}.`,
        affected_date: act.date,
        affected_activity_ids: [act.id],
        suggested_fix: {
          label: `Snap to journey start date (${trip.start_date})`,
          explanation: `Reassigns the activity to the first valid day of your trip.`,
          action_type: 'move_to_day',
          payload: {
            activityId: act.id,
            targetDate: trip.start_date,
            newStartTime: act.start_time,
            newEndTime: act.end_time,
          },
        },
      });
    }
  });

  // 6. BUDGET EXCEEDED CHECK
  if (isOverBudget) {
    const expensiveOptional = [...activities]
      .filter((a) => a.cost > 2000)
      .sort((a, b) => b.cost - a.cost)[0];

    issues.push({
      id: `issue_budget_exceeded`,
      type: 'budget_exceeded',
      severity: budgetDelta > 10000 ? 'critical' : 'warning',
      title: `Expenses Exceed Budget by ${formatINR(budgetDelta)}`,
      description: `Planned total is ${formatINR(totalCost)} vs allocated budget of ${formatINR(trip.total_budget)}.`,
      suggested_fix: expensiveOptional
        ? {
            label: expensiveOptional.cost > 5000 
              ? `Swap VIP "${expensiveOptional.activity_title}" (${formatINR(expensiveOptional.cost)}) with classic boat tour (₹850)`
              : `Adjust Trip Budget to ${formatINR(Math.ceil((totalCost + 2000) / 1000) * 1000)}`,
            explanation: expensiveOptional.cost > 5000
              ? `Replacing this luxury excursion with a premier classic experience saves ${formatINR(expensiveOptional.cost - 850)}, recovering your budget balance.`
              : `Increases your trip target budget to comfortably encompass all planned reservations.`,
            action_type: expensiveOptional.cost > 5000 ? 'swap_cheaper_alternative' : 'adjust_budget',
            payload: expensiveOptional.cost > 5000
              ? {
                  activityId: expensiveOptional.id,
                  replacementTitle: 'Scenic Sunset Heritage Lake Boat Cruise & Rooftop Tea',
                  newCost: 850,
                }
              : {
                  newBudget: Math.ceil((totalCost + 2000) / 1000) * 1000,
                },
          }
        : {
            label: `Increase budget to ${formatINR(Math.ceil((totalCost + 2000) / 1000) * 1000)}`,
            explanation: `Aligns your target cap with actual reserved accommodation and activities.`,
            action_type: 'adjust_budget',
            payload: {
              newBudget: Math.ceil((totalCost + 2000) / 1000) * 1000,
            },
          },
    });
  }

  // 7. DAILY BUDGET SPIKE
  const tripDaysCount = Math.max(1, Math.round(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 3600 * 24)
  ) + 1);
  const avgDailyTarget = trip.total_budget / tripDaysCount;

  Object.entries(activitiesByDate).forEach(([date, dayActs]) => {
    const dayActCost = dayActs.reduce((s, a) => s + (a.cost || 0), 0);
    const dayExpCost = expenses.filter((e) => e.date === date).reduce((s, e) => s + (e.amount || 0), 0);
    const dayTotal = dayActCost + dayExpCost;

    if (dayTotal > avgDailyTarget * 2.2 && dayTotal > 8000) {
      const highestItem = [...dayActs].sort((a, b) => b.cost - a.cost)[0];

      issues.push({
        id: `issue_daily_spike_${date}`,
        type: 'daily_budget_spike',
        severity: 'warning',
        title: `Single-Day Spending Spike: ${formatINR(dayTotal)} on ${date}`,
        description: `This single day consumes ${Math.round((dayTotal / trip.total_budget) * 100)}% of your total budget (${Math.round((dayTotal / avgDailyTarget) * 100)}% of daily average ${formatINR(avgDailyTarget)}/day).`,
        affected_date: date,
        suggested_fix: highestItem && highestItem.cost > 4000
          ? {
              label: `Replace VIP "${highestItem.activity_title}" (${formatINR(highestItem.cost)}) with classic heritage tour (₹1,200)`,
              explanation: `Reduces this day's expenditure by ${formatINR(highestItem.cost - 1200)} while retaining the destination experience.`,
              action_type: 'swap_cheaper_alternative',
              payload: {
                activityId: highestItem.id,
                replacementTitle: 'Premier Heritage Palace Guided Walk & Traditional Tea',
                newCost: 1200,
              },
            }
          : undefined,
      });
    }
  });

  // Calculate Feasibility Score (0 - 100)
  let score = 100;
  issues.forEach((iss) => {
    if (iss.severity === 'critical') score -= 22;
    else if (iss.severity === 'warning') score -= 10;
    else score -= 4;
  });
  const feasibilityScore = Math.max(15, Math.min(100, score));

  return {
    issues,
    feasibilityScore,
    metrics: {
      totalCost,
      budget: trip.total_budget,
      budgetDelta,
      isOverBudget,
      totalActivities: activities.length,
      busiestDay,
      conflictCount,
    },
  };
}

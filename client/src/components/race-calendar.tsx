import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RaceWithStats } from "@shared/schema";

interface RaceCalendarProps {
  races: RaceWithStats[];
}

export default function RaceCalendar({ races }: RaceCalendarProps) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const calendarData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dayRaces = races.filter(race => {
        const raceDate = new Date(race.date);
        return raceDate.toDateString() === current.toDateString();
      });

      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === currentMonth,
        races: dayRaces,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [races, currentMonth, currentYear]);

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <section>
      <h2 className="text-2xl font-bold text-white mb-6">Race Calendar</h2>
      
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">{monthName}</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" className="bg-gray-700 hover:bg-gray-600 border-gray-600">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="bg-gray-700 hover:bg-gray-600 border-gray-600">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {calendarData.map((day, index) => {
              const hasRaces = day.races.length > 0;
              const isRegistered = day.races.some(race => race.isRegistered);
              const isClosingSoon = day.races.some(race => 
                race.timeUntilDeadline === "< 1 hour" || race.timeUntilDeadline?.includes("hour")
              );

              return (
                <div
                  key={index}
                  className={`aspect-square p-1 text-center text-sm relative rounded ${
                    !day.isCurrentMonth 
                      ? "text-gray-500" 
                      : hasRaces
                        ? isRegistered
                          ? "bg-orange-500 bg-opacity-20 border border-orange-500"
                          : isClosingSoon
                            ? "bg-yellow-500 bg-opacity-20 border border-yellow-500"
                            : "bg-racing-green bg-opacity-20 border border-racing-green"
                        : "text-gray-300"
                  }`}
                >
                  <div className={`font-medium ${hasRaces && day.isCurrentMonth ? "text-white" : ""}`}>
                    {day.date.getDate()}
                  </div>
                  {hasRaces && (
                    <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                      isRegistered 
                        ? "bg-orange-500"
                        : isClosingSoon
                          ? "bg-yellow-500"
                          : "bg-racing-green"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
            <div className="flex space-x-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-racing-green rounded-full mr-2"></div>
                <span className="text-gray-400">Open Registration</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-gray-400">Closing Soon</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-gray-400">Registered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

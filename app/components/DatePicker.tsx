import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isBefore, 
  isToday, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth,
  isAfter,
  startOfDay
} from 'date-fns';
import { id } from 'date-fns/locale';

interface DatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
  disabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  minDate = new Date(), // Default to today
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return 'Pilih tanggal';
    return format(date, 'EEE, dd MMM yyyy', { locale: id });
  };

  // Update currentMonth when value changes
  useEffect(() => {
    if (value) {
      setCurrentMonth(value);
    }
  }, [value]);

  // Close on outside click and escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const handleSelectDate = (date: Date) => {
    // Create a new date without time component to avoid timezone issues
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    onChange(selectedDate);
    setIsOpen(false);
  };

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    const minDateStart = startOfDay(minDate);
    
    // Disable if date is before today OR before minDate (whichever is later)
    const minAllowedDate = isAfter(minDateStart, today) ? minDateStart : today;
    return isBefore(date, minAllowedDate);
  };

  const handlePreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    // Don't allow navigating to months where all dates are disabled
    const monthStart = startOfMonth(newMonth);
    const monthEnd = endOfMonth(newMonth);
    const today = startOfDay(new Date());
    
    // Only navigate if the month contains at least one enabled date
    if (!isBefore(monthEnd, today)) {
      setCurrentMonth(newMonth);
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="relative flex-1" ref={containerRef}>
      <label className="block text-sm font-medium text-muted-foreground mb-2">
        {label}
      </label>
      <button
        type="button"
        className={`w-full bg-card border rounded-xl transition-all duration-200 min-h-[72px] text-left ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : isOpen
            ? 'border-primary ring-2 ring-primary/20 shadow-lg cursor-pointer'
            : 'border-border hover:border-primary/50 hover:shadow-md cursor-pointer'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-label={`Pilih tanggal untuk ${label}`}
        aria-expanded={isOpen}
      >
        <div className="p-4 w-full">
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            Tanggal
          </div>
          <div className={`text-sm font-semibold ${value ? 'text-foreground' : 'text-muted-foreground'}`}>
            {formatDisplayDate(value)}
          </div>
        </div>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && !disabled && (
        <div 
          className="absolute z-50 mt-2 bg-card border border-border rounded-xl shadow-xl p-4 w-80 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Kalender pemilih tanggal"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <h3 className="font-semibold text-foreground" aria-live="polite">
              {format(currentMonth, 'MMMM yyyy', { locale: id })}
            </h3>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {getCalendarDays().map((date, index) => {
              const isSelected = value && isSameDay(date, value);
              const isDisabled = isDateDisabled(date);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isTodayDate = isToday(date);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !isDisabled && handleSelectDate(date)}
                  disabled={isDisabled}
                  className={`
                    h-10 text-sm rounded-lg transition-all duration-200 flex items-center justify-center
                    ${!isCurrentMonth ? 'text-muted-foreground/40' : ''}
                    ${isDisabled 
                      ? 'text-muted-foreground/30 cursor-not-allowed opacity-50' 
                      : 'hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                    }
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground font-semibold hover:bg-primary focus:bg-primary' 
                      : ''
                    }
                    ${isTodayDate && !isSelected && !isDisabled
                      ? 'border border-primary text-primary font-medium' 
                      : ''
                    }
                    ${isCurrentMonth && !isSelected && !isDisabled && !isTodayDate
                      ? 'text-foreground'
                      : ''
                    }
                  `}
                  aria-label={`Pilih tanggal ${format(date, 'd MMMM yyyy', { locale: id })}`}
                  aria-disabled={isDisabled}
                  aria-current={isTodayDate ? 'date' : undefined}
                  tabIndex={isDisabled ? -1 : 0}
                >
                  {format(date, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
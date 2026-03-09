'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { DayPicker, DateRange as DayPickerDateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export interface DatePickerProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  date,
  onSelect,
  minDate,
  maxDate,
  placeholder = '選擇日期',
  disabled = false,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2.5 rounded-lg border bg-white transition-colors',
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer',
          isOpen ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-300',
          !date && 'text-gray-400'
        )}
      >
        <span>{date ? format(date, 'yyyy年MM月dd日', { locale: zhTW }) : placeholder}</span>
        <CalendarIcon className="h-5 w-5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={(day) => {
              onSelect(day);
              setIsOpen(false);
            }}
            locale={zhTW}
            disabled={[
              { before: minDate || new Date() },
              { after: maxDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
            ]}
            classNames={{
              head_cell: 'text-gray-500 font-medium text-sm',
              cell: 'text-center p-1',
              day: 'w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors',
              day_selected: 'bg-primary-600 text-white hover:bg-primary-700',
              day_today: 'text-primary-600 font-semibold',
              day_disabled: 'text-gray-300 cursor-not-allowed',
              caption: 'flex justify-between items-center mb-4 px-2',
              caption_label: 'text-lg font-semibold text-gray-900',
              nav: 'flex gap-1',
              nav_button: 'p-1 rounded-lg hover:bg-gray-100',
              table: 'w-full border-collapse',
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-5 w-5" />,
              IconRight: () => <ChevronRight className="h-5 w-5" />,
            }}
          />
        </div>
      )}
    </div>
  );
}

export interface DateRangePickerProps {
  range: { from: Date | undefined; to: Date | undefined };
  onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function DateRangePicker({
  range,
  onSelect,
  minDate,
  maxDate,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2.5 rounded-lg border bg-white transition-colors hover:border-gray-400',
          isOpen ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-300'
        )}
      >
        <span className={cn(!range.from && !range.to && 'text-gray-400')}>
          {range.from && range.to
            ? `${format(range.from, 'MM/dd')} - ${format(range.to, 'MM/dd')}`
            : range.from
            ? `${format(range.from, 'MM/dd')} - 選擇退房日`
            : '選擇入住 / 退房日期'}
        </span>
        <CalendarIcon className="h-5 w-5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <DayPicker
            mode="range"
            selected={{
              from: range.from,
              to: range.to,
            }}
            onSelect={(selectedRange) => {
              onSelect({
                from: selectedRange?.from,
                to: selectedRange?.to,
              });
              if (selectedRange?.to) {
                setIsOpen(false);
              }
            }}
            locale={zhTW}
            numberOfMonths={2}
            disabled={[
              { before: minDate || new Date() },
              { after: maxDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
            ]}
            classNames={{
              months: 'flex gap-4',
              month: 'space-y-4',
              head_cell: 'text-gray-500 font-medium text-sm w-10',
              cell: 'text-center p-0.5',
              day: 'w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors',
              day_selected: 'bg-primary-600 text-white hover:bg-primary-700',
              day_range_middle: 'bg-primary-100 text-primary-900',
              day_range_start: 'bg-primary-600 text-white rounded-r-none',
              day_range_end: 'bg-primary-600 text-white rounded-l-none',
              day_today: 'text-primary-600 font-semibold',
              day_disabled: 'text-gray-300 cursor-not-allowed',
              caption: 'flex justify-between items-center px-2',
              caption_label: 'text-lg font-semibold text-gray-900',
              nav: 'flex gap-1',
              nav_button: 'p-1 rounded-lg hover:bg-gray-100',
              table: 'w-full border-collapse',
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-5 w-5" />,
              IconRight: () => <ChevronRight className="h-5 w-5" />,
            }}
          />
        </div>
      )}
    </div>
  );
}

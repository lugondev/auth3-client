'use client';

import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
}

export const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
  ({ value, onChange, placeholder, error, className, ...props }, ref) => {
    // Convert ISO string to datetime-local format
    const formatDateTimeLocal = (isoString: string): string => {
      if (!isoString) return '';
      const date = new Date(isoString);
      // Get timezone offset and adjust
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      return localDate.toISOString().slice(0, 16);
    };

    // Convert datetime-local format to ISO string
    const formatToISO = (dateTimeLocal: string): string => {
      if (!dateTimeLocal) return '';
      return new Date(dateTimeLocal).toISOString();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const localDateTime = e.target.value;
      if (onChange) {
        onChange(localDateTime ? formatToISO(localDateTime) : '');
      }
    };

    const setToNow = () => {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localDate = new Date(now.getTime() - offset);
      const localDateTime = localDate.toISOString().slice(0, 16);
      
      if (onChange) {
        onChange(formatToISO(localDateTime));
      }
    };

    const setToTomorrow = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const offset = tomorrow.getTimezoneOffset() * 60000;
      const localDate = new Date(tomorrow.getTime() - offset);
      const localDateTime = localDate.toISOString().slice(0, 16);
      
      if (onChange) {
        onChange(formatToISO(localDateTime));
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            ref={ref}
            type="datetime-local"
            value={value ? formatDateTimeLocal(value) : ''}
            onChange={handleChange}
            placeholder={placeholder}
            className={cn(
              error && 'border-red-500',
              className
            )}
            {...props}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={setToNow}
            className="px-3"
          >
            Now
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={setToTomorrow}
            className="text-xs text-gray-500 h-6"
          >
            Set to tomorrow
          </Button>
        </div>
      </div>
    );
  }
);

DateTimePicker.displayName = 'DateTimePicker';

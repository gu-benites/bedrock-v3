// src/features/dashboard/profile/components/enhanced-select.tsx
'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormControl } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  flag?: string;
  disabled?: boolean;
}

interface EnhancedSelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showIcons?: boolean;
  showFlags?: boolean;
  showDescriptions?: boolean;
  id?: string;
}

export function EnhancedSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  className,
  showIcons = false,
  showFlags = false,
  showDescriptions = false,
  id,
}: EnhancedSelectProps) {
  return (
    <Select onValueChange={onValueChange} value={value || undefined} disabled={disabled}>
      <FormControl>
        <SelectTrigger id={id} className={cn("w-full", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent className="max-h-[300px]">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              "cursor-pointer relative",
              showDescriptions && "py-3",
              option.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-3 w-full pr-6">
              {/* Icon or Flag */}
              {(showIcons && option.icon) && (
                <span className="text-lg flex-shrink-0" role="img" aria-label={option.label}>
                  {option.icon}
                </span>
              )}
              {(showFlags && option.flag) && (
                <span className="text-lg flex-shrink-0" role="img" aria-label={option.label}>
                  {option.flag}
                </span>
              )}

              {/* Label and Description */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-sm truncate">{option.label}</span>
                {showDescriptions && option.description && (
                  <span className="text-xs text-muted-foreground truncate">
                    {option.description}
                  </span>
                )}
              </div>

              {/* Selected indicator */}
              {value === option.value && (
                <Check className="h-4 w-4 text-primary absolute right-2" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Specialized components for different field types
export function LanguageSelect(props: Omit<EnhancedSelectProps, 'options' | 'showFlags'>) {
  const { languageOptions } = require('../hooks/use-profile-update');
  
  return (
    <EnhancedSelect
      {...props}
      options={languageOptions}
      showFlags={true}
      placeholder="Select your preferred language"
    />
  );
}

export function GenderSelect(props: Omit<EnhancedSelectProps, 'options' | 'showIcons'>) {
  const { genderOptions } = require('../hooks/use-profile-update');

  return (
    <EnhancedSelect
      {...props}
      options={genderOptions}
      showIcons={false}
      placeholder="Select your gender"
    />
  );
}

export function AgeCategorySelect(props: Omit<EnhancedSelectProps, 'options' | 'showDescriptions'>) {
  const { ageCategoryOptions } = require('../hooks/use-profile-update');
  
  return (
    <EnhancedSelect
      {...props}
      options={ageCategoryOptions}
      showDescriptions={true}
      placeholder="Select your age category"
    />
  );
}

export default EnhancedSelect;

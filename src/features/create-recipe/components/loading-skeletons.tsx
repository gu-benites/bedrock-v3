/**
 * @fileoverview Loading skeleton components for Essential Oil Recipe Creator.
 * Provides consistent loading states across all wizard steps.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ComponentKeyStrategies } from '@/lib/utils/component-key-strategies';

/**
 * Base skeleton component
 */
function Skeleton({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50",
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton for text lines
 */
function SkeletonText({ 
  lines = 1, 
  className 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Loading skeleton for causes/symptoms selection
 */
export function SelectionGridSkeleton({ 
  items = 6,
  columns = 2,
  className 
}: { 
  items?: number;
  columns?: number;
  className?: string; 
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <SkeletonText lines={2} />
      </div>

      {/* Selection counter skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Grid skeleton */}
      <div className={cn(
        "grid gap-4",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {Array.from({ length: items }).map((_, i) => (
          <div
            key={ComponentKeyStrategies.skeleton('grid-item', i)}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start space-x-3">
              <Skeleton className="w-5 h-5 rounded flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <SkeletonText lines={2} className="text-sm" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons skeleton */}
      <div className="flex justify-between items-center pt-4">
        <Skeleton className="h-10 w-24" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for properties display
 */
export function PropertiesDisplaySkeleton({ 
  properties = 4,
  className 
}: { 
  properties?: number;
  className?: string; 
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <SkeletonText lines={2} />
      </div>

      {/* Summary skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-4 space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-20 rounded-md" />
              ))}
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Properties skeleton */}
      <div className="space-y-4">
        {Array.from({ length: properties }).map((_, i) => (
          <div
            key={ComponentKeyStrategies.skeleton('property', i)}
            className="border rounded-lg p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>

            {/* Description */}
            <SkeletonText lines={2} />

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={ComponentKeyStrategies.skeleton('address', j)} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <SkeletonText lines={1} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons skeleton */}
      <div className="flex justify-between items-center pt-4">
        <Skeleton className="h-10 w-24" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for oils display
 */
export function OilsDisplaySkeleton({ 
  oils = 6,
  properties = 3,
  className 
}: { 
  oils?: number;
  properties?: number;
  className?: string; 
}) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <SkeletonText lines={2} />
      </div>

      {/* Summary stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 text-center space-y-2">
            <Skeleton className="h-8 w-12 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        ))}
      </div>

      {/* Top oils skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: oils }).map((_, i) => (
            <div
              key={i}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <Skeleton className="h-5 w-32" />
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="w-3 h-3" />
                  ))}
                </div>
              </div>
              
              <Skeleton className="h-4 w-24" />
              <SkeletonText lines={2} />
              
              <div className="space-y-2">
                <Skeleton className="h-3 w-40" />
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-20 rounded-md" />
                  ))}
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Properties breakdown skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-56" />
        
        <div className="space-y-4">
          {Array.from({ length: properties }).map((_, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex justify-between items-center pt-4">
        <Skeleton className="h-10 w-24" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for form components
 */
export function FormSkeleton({ 
  fields = 3,
  hasTextarea = false,
  className 
}: { 
  fields?: number;
  hasTextarea?: boolean;
  className?: string; 
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <SkeletonText lines={2} />
      </div>

      {/* Form fields skeleton */}
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            {hasTextarea && i === 0 ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Skeleton className="h-10 w-full" />
            )}
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>

      {/* Action buttons skeleton */}
      <div className="flex justify-between items-center pt-4">
        <Skeleton className="h-10 w-24" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
}

/**
 * Generic loading spinner
 */
export function LoadingSpinner({ 
  size = 'md',
  className 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string; 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size], className)} />
  );
}

/**
 * Full page loading component
 */
export function FullPageLoading({ 
  message = "Loading...",
  className 
}: { 
  message?: string;
  className?: string; 
}) {
  return (
    <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export { Skeleton, SkeletonText };

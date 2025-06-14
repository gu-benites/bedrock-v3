/**
 * @fileoverview Chat-style Health Concern Input component for Essential Oil Recipe Creator.
 * Provides a clean, minimal interface similar to the chat page for the first step.
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, Sparkles } from 'lucide-react';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import { RecipeStep } from '../types/recipe.types';

/**
 * Helper hook for auto-resizing textarea
 */
function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: { minHeight: number; maxHeight?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }
      textarea.style.height = `${minHeight}px`; // Reset first to get scrollHeight correctly
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight(); // Adjust on window resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

/**
 * Chat-style Health Concern Input component
 */
export function HealthConcernChatInput() {
  const {
    healthConcern,
    updateHealthConcern,
    updateDemographics,
    updateSelectedCauses,
    updateSelectedSymptoms,
    updateTherapeuticProperties,
    setCurrentStep,
    markStepCompleted,
    isLoading
  } = useRecipeStore();
  const { goToNext, canGoNext, markCurrentStepCompleted, goToStep } = useRecipeWizardNavigation();
  
  const [inputValue, setInputValue] = useState(healthConcern?.healthConcern || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  /**
   * Auto-save functionality with debouncing
   */
  const autoSave = useCallback(async (value: string) => {
    if (value.trim().length < 3) return;

    setIsSaving(true);
    try {
      updateHealthConcern({ healthConcern: value });
      
      // Mark step as completed if valid
      if (value.trim().length >= 3) {
        markCurrentStepCompleted();
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [updateHealthConcern, markCurrentStepCompleted]);

  /**
   * Debounced auto-save effect
   */
  useEffect(() => {
    if (!inputValue || inputValue.trim().length < 3) return;

    const timeoutId = setTimeout(() => {
      autoSave(inputValue);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [inputValue, autoSave]);

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    adjustHeight();
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (inputValue.trim().length < 3 || isLoading) return;
    
    try {
      updateHealthConcern({ healthConcern: inputValue });
      markCurrentStepCompleted();

      if (canGoNext()) {
        await goToNext();
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  /**
   * Handle key down events
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };



  const characterCount = inputValue?.length || 0;
  const isValid = characterCount >= 3 && characterCount <= 500;
  const isNearLimit = characterCount > 450;
  const isAtLimit = characterCount >= 500;

  return (
    <div className="flex flex-col h-full">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-8">
        {/* Welcome Message */}
        <div className="text-center space-y-4 max-w-2xl">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Create Your Recipe
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Tell us about your health concern and we'll create a personalized essential oil recipe for you
          </p>
          <p className="text-sm text-muted-foreground">
            Be as specific as possible for the best recommendations
          </p>


        </div>

        {/* Example Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
          {[
            "I have chronic headaches that worsen with stress and lack of sleep",
            "Experiencing digestive issues with bloating after meals",
            "Difficulty falling asleep and staying asleep, feeling anxious at bedtime",
            "Muscle tension in shoulders and neck from desk work"
          ].map((example, index) => (
            <button
              key={index}
              onClick={() => {
                setInputValue(example);
                adjustHeight();
              }}
              className="p-4 text-left bg-card border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        <div className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-4">
          <div className="w-full">
            <div className="relative bg-card rounded-xl border border-border shadow-md">
              <div className="overflow-y-auto">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your health concern in detail..."
                  className={cn(
                    "w-full px-4 py-3", "resize-none", "bg-transparent", "border-none",
                    "text-foreground text-sm", "focus:outline-none", "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "placeholder:text-muted-foreground placeholder:text-sm",
                    "min-h-[60px]"
                  )}
                  style={{ overflow: "hidden" }}
                  disabled={isLoading}
                  maxLength={500}
                />
              </div>
              
              {/* Toolbar */}
              <div className="flex items-center justify-between p-3 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {isSaving && (
                    <div className="flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                      <span>Saving...</span>
                    </div>
                  )}
                  <span className={cn(
                    isNearLimit && "text-orange-500",
                    isAtLimit && "text-destructive"
                  )}>
                    {characterCount}/500
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {isValid && (
                    <span className="text-xs text-green-600">✓ Ready</span>
                  )}
                  <button
                    type="button"
                    className={cn(
                      "px-1.5 py-1.5 rounded-lg text-sm transition-colors border border-transparent flex items-center justify-center gap-1",
                      isValid
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                    disabled={!isValid || isLoading}
                    onClick={handleSubmit}
                    aria-label="Continue to next step"
                  >
                    <ArrowUpIcon className="w-4 h-4" />
                    <span className="sr-only">Continue</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

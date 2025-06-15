'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAutoScroll, useAnimatedEllipsis } from '@/hooks';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface StreamingItem {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  timestamp?: Date;
}

interface AIStreamingModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  items: StreamingItem[];
  onClose?: () => void;
  className?: string;
  maxVisibleItems?: number;
  analysisType?: string;
  terminalTitle?: string;
  terminalSubtitle?: string;
  loadingMessage?: string;
  progressMessage?: string;
}

const AIStreamingModal: React.FC<AIStreamingModalProps> = ({
  isOpen,
  title,
  description,
  items,
  onClose,
  className,
  maxVisibleItems = 100,
  analysisType = "causes",
  terminalTitle,
  terminalSubtitle,
  loadingMessage,
  progressMessage
}) => {
  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'symptoms':
        return {
          terminalTitle: 'Potential Symptoms Analysis',
          terminalSubtitle: 'Identifying symptoms that may manifest based on your selected causes.',
          loadingMessage: 'analyzing selected causes...',
          progressMessage: 'Analyzing more potential symptoms...'
        };
      case 'properties':
        return {
          terminalTitle: 'Therapeutic Properties Analysis',
          terminalSubtitle: 'Finding therapeutic properties to address your symptoms.',
          loadingMessage: 'analyzing symptoms...',
          progressMessage: 'Analyzing more therapeutic properties...'
        };
      case 'oils':
        return {
          terminalTitle: 'Essential Oils Analysis',
          terminalSubtitle: 'Recommending essential oils with the identified properties.',
          loadingMessage: 'analyzing properties...',
          progressMessage: 'Analyzing more essential oils...'
        };
      case 'causes':
      default:
        return {
          terminalTitle: 'Potential Causes Analysis',
          terminalSubtitle: 'Understanding factors that may contribute to your symptoms.',
          loadingMessage: 'analyzing demographics...',
          progressMessage: 'Analyzing more potential causes...'
        };
    }
  };

  const defaultContent = getDefaultContent(analysisType);
  const finalTerminalTitle = terminalTitle || defaultContent.terminalTitle;
  const finalTerminalSubtitle = terminalSubtitle || defaultContent.terminalSubtitle;
  const finalLoadingMessage = loadingMessage || defaultContent.loadingMessage;
  const finalProgressMessage = progressMessage || defaultContent.progressMessage;
  const { scrollRef } = useAutoScroll([items.length, items], {
    threshold: 50,
    smooth: true,
    scrollDelay: 50
  });

  const streamingEllipsis = useAnimatedEllipsis();
  const footerEllipsis = useAnimatedEllipsis();

  const displayItems = items.slice(0, maxVisibleItems);

  React.useEffect(() => {
    console.log('🎬 Modal items updated:', {
      totalItems: items.length,
      displayItems: displayItems.length,
      firstItem: items[0]?.title,
      lastItem: items[items.length - 1]?.title
    });
  }, [items.length, displayItems.length]);

  React.useEffect(() => {
    if (scrollRef.current && items.length > 0) {
      const scrollContainer = scrollRef.current;
      const isNearBottomCheck = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight <= 100;

      if (isNearBottomCheck) {
        setTimeout(() => {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        }, 400);
      }
    }
  }, [items.length]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("w-full max-w-2xl mx-auto", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="relative">
              <Brain className="h-6 w-6 text-primary" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full"
              />
            </div>
            <span>{title}</span>
            <Badge variant="secondary" className="text-sm font-medium ml-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              {items.length} found
            </Badge>
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="pt-0">
          <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
              <span className="text-slate-400 text-sm font-mono">
                streaming{streamingEllipsis}
              </span>
            </div>

            <div
              ref={scrollRef}
              className="h-80 w-full overflow-y-auto scroll-smooth scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div className="p-2 font-mono text-xs leading-tight">
                {displayItems.length === 0 ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="text-center">
                      <div className="text-green-400 mb-1">$ {finalLoadingMessage}</div>
                      <div className="flex items-center justify-center space-x-1">
                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-cyan-400 mb-2">
                      <div className="text-sm font-bold"># {finalTerminalTitle}</div>
                      <div className="text-slate-400 text-xs">{finalTerminalSubtitle}</div>
                    </div>

                    {displayItems.map((item, index) => {
                      const stableKey = `item-${index}-${item.title?.slice(0, 20)}`;

                      return (
                        <div
                          key={stableKey}
                          className="mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
                        >
                          <div className="text-yellow-400 font-bold mb-1">
                            ## {item.title}
                          </div>

                          {item.subtitle && (
                            <div className="text-blue-300 mb-1 leading-tight">
                              {item.subtitle}
                            </div>
                          )}

                          {item.description && (
                            <div className="text-slate-300 leading-tight mb-2">
                              {item.description}
                            </div>
                          )}

                          {index < displayItems.length - 1 && (
                            <div className="border-t border-slate-700 my-2"></div>
                          )}
                        </div>
                      );
                    })}

                    <div className="flex items-center text-green-400 mt-1">
                      <span className="mr-1">$</span>
                      <div className="w-1 h-3 bg-green-400 animate-pulse"></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {isOpen && items.length > 0 && (
            <div className="mt-4 pt-3 border-t">
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium text-primary">
                    {finalProgressMessage}
                  </p>
                  <p className="text-xs text-primary/70">
                    AI is processing your information to find additional insights
                  </p>
                </div>
              </motion.div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Live analysis in progress{footerEllipsis}</span>
              </div>
              <span>
                {items.length > maxVisibleItems &&
                  `Showing latest ${maxVisibleItems} of ${items.length}`
                }
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { AIStreamingModal };
export default AIStreamingModal;
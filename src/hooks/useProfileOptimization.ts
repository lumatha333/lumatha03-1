import { useEffect, useRef, useState, useCallback } from 'react';

interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Hook for lazy-loading profile subsections
 * Loads content only when it becomes visible to the user
 */
export function useLazyProfileSection(
  sectionId: string,
  loadFn: () => Promise<void>,
  options: LazyLoadOptions = {}
) {
  const { threshold = 0.1, rootMargin = '100px' } = options;
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoaded && !isLoading) {
          setIsLoading(true);
          try {
            await loadFn();
            setIsLoaded(true);
          } catch (error) {
            console.error(`Failed to load profile section ${sectionId}:`, error);
          } finally {
            setIsLoading(false);
          }
        }
      },
      { threshold, rootMargin }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [sectionId, isLoaded, isLoading, loadFn, threshold, rootMargin]);

  return { ref, isLoaded, isLoading };
}

/**
 * Hook for deferring state updates until after initial render
 * Helps with profile skeleton performance
 */
export function useDeferredUpdate<T>(value: T, delay: number = 300) {
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return deferredValue;
}

/**
 * Hook for tracking which tabs are visible (virtualizing off-screen profiles)
 */
export function useVisibleTabContent(activeTab: string, tabs: string[]) {
  const [visibleTabs, setVisibleTabs] = useState<Set<string>>(new Set([activeTab]));

  useEffect(() => {
    // Load active tab + adjacent tabs for smooth switching
    const activeIndex = tabs.indexOf(activeTab);
    const newVisible = new Set<string>();
    newVisible.add(activeTab);
    if (activeIndex > 0) newVisible.add(tabs[activeIndex - 1]);
    if (activeIndex < tabs.length - 1) newVisible.add(tabs[activeIndex + 1]);
    setVisibleTabs(newVisible);
  }, [activeTab, tabs]);

  return visibleTabs;
}

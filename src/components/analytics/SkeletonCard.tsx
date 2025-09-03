'use client';

interface SkeletonCardProps {
  className?: string;
  children?: React.ReactNode;
}

export function SkeletonCard({ className = '', children }: SkeletonCardProps) {
  return (
    <div className={`bg-slate-800/50 p-6 rounded-lg border border-slate-700 animate-pulse ${className}`}>
      {children}
    </div>
  );
}

export function SkeletonBar({ width = '100%', height = '1rem' }: { width?: string; height?: string }) {
  return (
    <div 
      className="bg-slate-700 rounded animate-pulse"
      style={{ width, height }}
    />
  );
}

export function SkeletonCircle({ size = '2rem' }: { size?: string }) {
  return (
    <div 
      className="bg-slate-700 rounded-full animate-pulse"
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBar 
          key={i} 
          width={i === lines - 1 ? '75%' : '100%'} 
          height="0.875rem" 
        />
      ))}
    </div>
  );
}

// Specific skeleton components for analytics
export function MetricCardSkeleton() {
  return (
    <SkeletonCard>
      <div className="flex items-center gap-3 mb-2">
        <SkeletonCircle size="1.25rem" />
        <SkeletonBar width="60%" height="1rem" />
      </div>
      <SkeletonBar width="40%" height="2rem" />
      <div className="mt-2">
        <SkeletonBar width="80%" height="0.75rem" />
      </div>
    </SkeletonCard>
  );
}

export function ChartSkeleton() {
  return (
    <SkeletonCard>
      <div className="flex items-center gap-3 mb-6">
        <SkeletonCircle size="1.25rem" />
        <SkeletonBar width="40%" height="1.25rem" />
      </div>
      
      {/* Chart bars */}
      <div className="flex items-end gap-2 h-32 mb-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <SkeletonBar 
              width="100%" 
              height={`${Math.random() * 60 + 20}%`}
            />
          </div>
        ))}
      </div>
      
      <SkeletonText lines={2} />
    </SkeletonCard>
  );
}

export function HeatmapSkeleton() {
  return (
    <SkeletonCard>
      <div className="flex items-center gap-3 mb-6">
        <SkeletonCircle size="1.25rem" />
        <SkeletonBar width="50%" height="1.25rem" />
      </div>
      
      {/* Heatmap grid */}
      <div className="grid grid-cols-12 gap-1 mb-4">
        {Array.from({ length: 84 }).map((_, i) => (
          <SkeletonBar key={i} width="100%" height="0.75rem" />
        ))}
      </div>
      
      <div className="flex justify-between">
        <SkeletonBar width="15%" height="0.75rem" />
        <SkeletonBar width="15%" height="0.75rem" />
      </div>
    </SkeletonCard>
  );
}

export function SubjectCardSkeleton() {
  return (
    <SkeletonCard>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonCircle size="1rem" />
        <SkeletonBar width="70%" height="1rem" />
      </div>
      
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between mb-1">
            <SkeletonBar width="30%" height="0.75rem" />
            <SkeletonBar width="20%" height="0.75rem" />
          </div>
          <SkeletonBar width="100%" height="0.5rem" />
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <SkeletonBar width="25%" height="0.75rem" />
            <SkeletonBar width="20%" height="0.75rem" />
          </div>
          <SkeletonBar width="100%" height="0.5rem" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard className="p-2">
          <SkeletonBar width="60%" height="0.75rem" />
          <SkeletonBar width="40%" height="1rem" />
        </SkeletonCard>
        <SkeletonCard className="p-2">
          <SkeletonBar width="60%" height="0.75rem" />
          <SkeletonBar width="40%" height="1rem" />
        </SkeletonCard>
      </div>
    </SkeletonCard>
  );
}
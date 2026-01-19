import { ReactNode } from 'react';

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  tall?: boolean;
}

export function LabarileChartContainer({ title, children, tall }: ChartContainerProps) {
  return (
    <div className="bg-labarile-white border border-labarile-border rounded-xl p-5 lg:p-7">
      <h3 className="font-bebas text-lg lg:text-xl text-labarile-title mb-4 lg:mb-5 tracking-wide">
        {title}
      </h3>
      <div className={tall ? "h-[350px] lg:h-[400px]" : ""}>
        {children}
      </div>
    </div>
  );
}

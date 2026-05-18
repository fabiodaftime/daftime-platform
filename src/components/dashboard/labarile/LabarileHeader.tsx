interface LabarileHeaderProps {
  title: string;
  subtitle: string;
}

export function LabarileHeader({ title, subtitle }: LabarileHeaderProps) {
  return (
    <header className="bg-labarile-white border-b border-labarile-border sticky top-0 z-50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 lg:px-10 py-4 lg:py-5 gap-4">
        <div className="ml-10 lg:ml-0">
          <h2 className="font-bebas text-xl lg:text-[28px] tracking-wide text-labarile-title">
            {title}
          </h2>
          <p className="text-xs lg:text-[13px] text-labarile-muted mt-1">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}

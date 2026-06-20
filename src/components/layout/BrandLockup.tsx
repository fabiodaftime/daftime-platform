// Lockup de marque Daftime : logo détouré + trait + « Advisory ».
// variant 'default' (logo couleur sur fond clair) ou 'light' (blanc, pour fond foncé).
import daftimeLogo from '@/assets/daftime-logo-trans.png';

export function BrandLockup({
  variant = 'default',
  center = true,
  logoClass = 'h-[22px]',
  className = '',
}: {
  variant?: 'default' | 'light';
  center?: boolean;
  logoClass?: string;
  className?: string;
}) {
  const light = variant === 'light';
  return (
    <div className={`flex flex-col leading-none ${center ? 'items-center' : 'items-start'} ${className}`}>
      <img src={daftimeLogo} alt="Daftime Advisory" className={`${logoClass} w-auto ${light ? 'brightness-0 invert' : ''}`} />
      <div className={`h-px w-10 my-1.5 ${light ? 'bg-white/50' : 'bg-primary/40'}`} />
      <span className={`text-[10px] tracking-[0.4em] uppercase font-bold leading-none ${light ? 'text-white' : 'text-primary'}`}>
        Advisory
      </span>
    </div>
  );
}

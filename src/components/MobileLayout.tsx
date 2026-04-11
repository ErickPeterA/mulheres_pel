import { ReactNode } from "react";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
}

const MobileLayout = ({ children, className = "" }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className={`w-full max-w-[430px] min-h-screen bg-background ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default MobileLayout;

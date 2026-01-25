import React from "react";
import { Zap, Diamond, Target, Check, ArrowRight, Mic, Barcode, LucideProps } from "lucide-react";

const ZapIcon = Zap as React.ElementType;
const DiamondIcon = Diamond as React.ElementType;
const TargetIcon = Target as React.ElementType;
const CheckIcon = Check as React.ElementType;
const ArrowRightIcon = ArrowRight as React.ElementType;
const MicIcon = Mic as React.ElementType;
const BarcodeIcon = Barcode as React.ElementType;

interface IconProps {
    className?: string;
    size?: number;
}

// Core Feature Icons
export const LightningBolt: React.FC<IconProps> = ({ className, size = 32 }) => (
    <ZapIcon
        className={`text-brand-teal ${className}`}
        strokeWidth={1.5}
        size={size}
    />
);

export const LuxuryDiamond: React.FC<IconProps> = ({ className, size = 32 }) => (
    <DiamondIcon
        className={`text-brand-teal ${className}`}
        strokeWidth={1.5}
        size={size}
    />
);

export const LuxuryTarget: React.FC<IconProps> = ({ className, size = 32 }) => (
    <TargetIcon
        className={`text-brand-teal ${className}`}
        strokeWidth={1.5}
        size={size}
    />
);

export const LuxuryCheck: React.FC<IconProps> = ({ className, size = 24 }) => (
    <CheckIcon
        className={`text-brand-teal ${className}`}
        strokeWidth={1.5}
        size={size}
    />
);

export const LuxuryArrow: React.FC<IconProps> = ({ className, size = 20 }) => (
    <ArrowRightIcon
        className={`text-brand-teal ${className}`}
        strokeWidth={1.5}
        size={size}
    />
);

// New Luxury Elements
export const VoiceMic: React.FC<IconProps> = ({ className, size = 24 }) => (
    <MicIcon
        className={`text-brand-teal ${className} hover:scale-110 transition-transform duration-300`}
        strokeWidth={1.5}
        size={size}
    />
);

export const BarcodeMotif: React.FC<IconProps> = ({ className, size = 48 }) => (
    <BarcodeIcon
        className={`text-brand-gold/10 ${className}`}
        strokeWidth={1}
        size={size}
    />
);

// Synqra Logo Component
export const SynqraLogo: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`font-display text-2xl font-medium tracking-tight ${className}`}>
        <span className="text-brand-gold">S</span>
        <span className="text-white">YNQRA</span>
    </div>
);

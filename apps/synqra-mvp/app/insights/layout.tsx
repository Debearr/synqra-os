import React from 'react';

interface InsightsLayoutProps {
    children: React.ReactNode;
}

const InsightsLayout: React.FC<InsightsLayoutProps> = ({ children }) => {
    return (
        <div>
            {children}
        </div>
    );
};

export default InsightsLayout;

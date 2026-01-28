import React from 'react';
import '../../style/AnimatedDots.css'; // CSS file for animation

const AnimatedDots: React.FC = () => {
    return (
        <span className="dots">
            <span></span>
            <span></span>
            <span></span>
        </span>
    );
};

export default AnimatedDots;

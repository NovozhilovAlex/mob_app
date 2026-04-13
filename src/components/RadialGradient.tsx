import React from 'react';
import Svg, {
    Defs,
    RadialGradient as SVGRadialGradient,
    Rect,
    Stop,
} from 'react-native-svg';

export interface Color {
    offset: string;
    color: string;
    opacity: string;
}

export const RadialGradient = ({ colorList, x, y, rx, ry }: {  colorList: Color[]; x: string; y: string; rx: string; ry: string}) => {
    return (
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
                <SVGRadialGradient
                    id="grad"
                    cx={x}
                    cy={y}
                    rx={rx}
                    ry={ry}
                    gradientUnits="userSpaceOnUse"
                >
                    {colorList.map((value, index) => (
                        <Stop
                            key={`RadialGradientItem_${index}`}
                            offset={value.offset}
                            stopColor={value.color}
                            stopOpacity={value.opacity}
                        />
                    ))}
                </SVGRadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
        </Svg>
    );
};
import { useWindowDimensions } from 'react-native';

type Orientation = 'LANDSCAPE' | 'PORTRAIT';

export const useCustomOrientation = (): Orientation => {
  const { width, height } = useWindowDimensions();
  return width > height ? 'LANDSCAPE' : 'PORTRAIT';
};
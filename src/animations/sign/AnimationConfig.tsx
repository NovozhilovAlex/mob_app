export type SignInputOutput = {
  input: number[];
  output: number[];
};

export interface SignAnimationConfig {
  endValue: number;
  duration: number;
  isRotateByZ: boolean;
  rotations: {
    x: SignInputOutput;
    y: SignInputOutput;
    z: SignInputOutput;
  };
  lumen?: SignInputOutput;
}


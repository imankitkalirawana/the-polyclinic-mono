import { pixelBasedPreset } from '@react-email/components';

interface TailwindConfig {
  presets: unknown[];
  theme: {
    extend: {
      colors: Record<string, string>;
    };
  };
}

const config: TailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        brand: '#1F6439',
        background: '#fff',
        foreground: '#9197A1',
      },
    },
  },
};

export default config;

import { Chip } from '@heroui/react';
import { CHIP_CONFIG } from './config';

export default function RenderChip({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  return (
    <Chip size="sm" classNames={CHIP_CONFIG[value]}>
      {value}
    </Chip>
  );
}

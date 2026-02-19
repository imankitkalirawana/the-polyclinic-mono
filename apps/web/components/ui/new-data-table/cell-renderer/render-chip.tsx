import { Chip } from '@heroui/react';
import { CHIP_CONFIG } from './config';
import { formatLabel } from '@repo/store';

export default function RenderChip({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  return (
    <Chip size="sm" classNames={CHIP_CONFIG[value]}>
      {formatLabel(value)}
    </Chip>
  );
}

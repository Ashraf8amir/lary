import { Transform } from 'class-transformer';

export function Trim() {
  return Transform(({ value }: { value?: unknown }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value).trim();
    }
    return value;
  });
}

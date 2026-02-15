import slugify from 'slugify';

export function generateSpecializationSlug(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

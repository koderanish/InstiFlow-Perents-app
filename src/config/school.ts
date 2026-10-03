import school from '../../school.config.json';

/** School identity compiled into this app. */
export const SCHOOL = {
  name: school.name,
  shortName: school.shortName,
  code: school.schoolCode,
  accent: school.accent,
} as const;

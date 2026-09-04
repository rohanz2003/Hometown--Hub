/**
 * utils/validators.test.js — the client-side schemas that guard the forms.
 */
import {
  changePasswordSchema,
  communitySchema,
  eventSchema,
  loginSchema,
  parseTags,
  postSchema,
  registerSchema,
} from './validators';

const validRegistration = {
  name: 'Asha Menon',
  email: 'asha@example.com',
  phone: '',
  password: 'Hometown123',
  confirmPassword: 'Hometown123',
  city: 'Kollengode',
  state: 'Kerala',
  country: 'India',
};

describe('loginSchema', () => {
  it('accepts an email and password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'secret' }).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/valid email/i);
  });
});

describe('registerSchema', () => {
  it('accepts a complete registration', () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it('requires a hometown city', () => {
    const result = registerSchema.safeParse({ ...validRegistration, city: '' });
    expect(result.success).toBe(false);
    expect(result.error.issues.some((i) => i.path.includes('city'))).toBe(true);
  });

  it('rejects a password with no digit', () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      password: 'hometownhub',
      confirmPassword: 'hometownhub',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues.some((i) => /number/i.test(i.message))).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      confirmPassword: 'Different123',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues.some((i) => i.path.includes('confirmPassword'))).toBe(true);
  });
});

describe('changePasswordSchema', () => {
  it('requires the confirmation to match', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass123',
      newPassword: 'NewPass123',
      confirmPassword: 'Mismatch123',
    });
    expect(result.success).toBe(false);
  });
});

describe('communitySchema', () => {
  const valid = {
    name: 'Riverside Circle',
    description: '',
    city: 'Riverside',
    state: '',
    country: '',
    visibility: 'public',
    requiresApproval: false,
    tagsText: '',
  };

  it('accepts a minimal community', () => {
    expect(communitySchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a name under three characters', () => {
    expect(communitySchema.safeParse({ ...valid, name: 'Hi' }).success).toBe(false);
  });

  it('rejects an unknown visibility', () => {
    expect(communitySchema.safeParse({ ...valid, visibility: 'secret' }).success).toBe(false);
  });
});

describe('postSchema', () => {
  it('requires a body', () => {
    const result = postSchema.safeParse({ title: '', body: '   ', type: 'discussion' });
    expect(result.success).toBe(false);
  });

  it('accepts a body with no title', () => {
    expect(postSchema.safeParse({ body: 'Just a quick note', type: 'discussion' }).success).toBe(
      true,
    );
  });
});

describe('eventSchema', () => {
  const valid = {
    title: 'Village clean-up',
    description: '',
    startsAt: '2026-09-12T09:00',
    endsAt: '',
    isAllDay: false,
    venue: 'School ground',
    address: '',
    city: 'Kollengode',
    isOnline: false,
    meetingUrl: '',
    capacity: 0,
  };

  it('accepts a valid event', () => {
    expect(eventSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an end time before the start', () => {
    const result = eventSchema.safeParse({ ...valid, endsAt: '2026-09-12T08:00' });
    expect(result.success).toBe(false);
    expect(result.error.issues.some((i) => i.path.includes('endsAt'))).toBe(true);
  });

  it('requires a meeting link for an online event', () => {
    const result = eventSchema.safeParse({ ...valid, isOnline: true });
    expect(result.success).toBe(false);
    expect(result.error.issues.some((i) => i.path.includes('meetingUrl'))).toBe(true);
  });
});

describe('parseTags', () => {
  it('splits, trims, and lowercases', () => {
    expect(parseTags(' Festival, Volunteers ,ROADS ')).toEqual(['festival', 'volunteers', 'roads']);
  });

  it('drops empties and caps at eight', () => {
    expect(parseTags('a,,b,')).toEqual(['a', 'b']);
    expect(parseTags('1,2,3,4,5,6,7,8,9,10')).toHaveLength(8);
  });

  it('handles empty input', () => {
    expect(parseTags('')).toEqual([]);
    expect(parseTags(undefined)).toEqual([]);
  });
});

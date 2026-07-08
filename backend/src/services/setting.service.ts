import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';

export const settingService = {
  async getAll(group?: string) {
    const where: any = {};
    if (group) {
      where.group = group;
    }

    const settings = await prisma.setting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    return settings;
  },

  async get(key: string) {
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting) {
      throw new NotFoundError(`Setting '${key}' not found`);
    }

    return setting;
  },

  async update(key: string, value: string) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) {
      throw new NotFoundError(`Setting '${key}' not found`);
    }

    const updated = await prisma.setting.update({
      where: { key },
      data: { value },
    });

    return updated;
  },

  async updateBulk(settings: { key: string; value: string }[]) {
    const results = [];
    for (const s of settings) {
      const existing = await prisma.setting.findUnique({ where: { key: s.key } });
      if (existing) {
        const updated = await prisma.setting.update({
          where: { key: s.key },
          data: { value: s.value },
        });
        results.push(updated);
      }
    }

    return results;
  },

  async getUniversityInfo() {
    const settings = await prisma.setting.findMany({
      where: { group: 'university' },
    });

    const info: Record<string, string> = {};
    for (const s of settings) {
      info[s.key] = s.value;
    }

    return info;
  },

  async updateLogo(url: string) {
    const setting = await prisma.setting.upsert({
      where: { key: 'university_logo' },
      update: { value: url },
      create: {
        key: 'university_logo',
        value: url,
        group: 'university',
        type: 'STRING',
        description: 'University logo URL',
      },
    });

    return setting;
  },

  async getAcademicYear() {
    const academicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
    });

    return academicYear;
  },

  async setCurrentAcademicYear(academicYearId: string) {
    await prisma.$transaction([
      prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      }),
      prisma.academicYear.update({
        where: { id: academicYearId },
        data: { isCurrent: true },
      }),
    ]);

    return prisma.academicYear.findUnique({ where: { id: academicYearId } });
  },

  async getSemester() {
    const semester = await prisma.semester.findFirst({
      where: { isCurrent: true },
      include: {
        academicYear: true,
      },
    });

    return semester;
  },

  async setCurrentSemester(semesterId: string) {
    await prisma.$transaction([
      prisma.semester.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      }),
      prisma.semester.update({
        where: { id: semesterId },
        data: { isCurrent: true },
      }),
    ]);

    return prisma.semester.findUnique({
      where: { id: semesterId },
      include: { academicYear: true },
    });
  },
};

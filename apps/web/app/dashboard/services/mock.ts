'use server';

import { faker } from '@faker-js/faker';

import { ServiceStatus, ServiceType } from '@/services/client/service/service.types';
import type { Service } from '@repo/store';

export async function generateServices(count: number) {
  const services: Service[] = [];

  for (let i = 0; i < count; i++) {
    const service: Service = {
      id: faker.string.uuid(),
      uniqueId: faker.number.int({ min: 1000, max: 9999 }).toString(),
      name: faker.lorem.words(2),
      description: faker.lorem.sentence(),
      summary: faker.lorem.sentence(),
      price: faker.number.int({ min: 100, max: 9999 }),
      duration: faker.number.int({ min: 1, max: 72 }),
      status: faker.helpers.arrayElement([ServiceStatus.ACTIVE, ServiceStatus.INACTIVE]),
      type: faker.helpers.arrayElement([
        ServiceType.MEDICAL,
        ServiceType.SURGICAL,
        ServiceType.DIAGNOSTIC,
        ServiceType.CONSULTATION,
      ]),
      fields: {},
      createdBy: faker.string.uuid(),
      updatedBy: faker.string.uuid(),
      createdAt: faker.date.past({
        refDate: new Date('2025-01-01'),
      }),
      updatedAt: faker.date.past({
        refDate: new Date('2025-01-01'),
      }),
    };

    services.push(service);
  }

  return services;
}

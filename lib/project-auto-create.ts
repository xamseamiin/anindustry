/**
 * Auto Project Creation Service
 * Automatically creates projects if they don't exist
 */

import prisma from '@/lib/db';

interface CreateProjectOptions {
  name: string;
  companyId: string;
  customerId?: string;
  description?: string;
}

export class ProjectAutoCreate {
  /**
   * Find or create project by name
   */
  static async findOrCreate(options: CreateProjectOptions): Promise<{ id: string; created: boolean }> {
    const { name, companyId, customerId, description } = options;

    // First, try to find existing project
    const existing = await prisma.project.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        companyId,
      },
    });

    if (existing) {
      return { id: existing.id, created: false };
    }

    // If not found, get default customer or use provided one
    let finalCustomerId = customerId;
    if (!finalCustomerId) {
      // Get first customer for the company
      const firstCustomer = await prisma.customer.findFirst({
        where: { companyId },
        orderBy: { createdAt: 'asc' },
      });
      
      if (!firstCustomer) {
        throw new Error('No customer found. Please create a customer first.');
      }
      
      finalCustomerId = firstCustomer.id;
    }

    // Create new project with defaults
    const newProject = await prisma.project.create({
      data: {
        name,
        description: description || `Auto-created project: ${name}`,
        agreementAmount: 0,
        advancePaid: 0,
        remainingAmount: 0,
        projectType: 'CONSTRUCTION', // Default type
        status: 'ACTIVE',
        expectedCompletionDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        customerId: finalCustomerId,
        companyId,
      },
    });

    return { id: newProject.id, created: true };
  }

  /**
   * Check if project exists
   */
  static async exists(name: string, companyId: string): Promise<boolean> {
    const project = await prisma.project.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        companyId,
      },
    });

    return !!project;
  }
}


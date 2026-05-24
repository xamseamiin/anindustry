// lib/scheduler.ts - Scheduled Reports System
import { cache } from './cache';
import { notificationManager } from './notifications';

export interface ScheduledReport {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  reportType: 'overview' | 'profit-loss' | 'expenses' | 'debts' | 'custom';
  companyId: string;
  userId?: string;
  emailRecipients: string[];
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  createdAt: string;
  customReportId?: string;
  filters?: any;
}

class ReportScheduler {
  private scheduledReports = new Map<string, ScheduledReport[]>();
  private intervals = new Map<string, NodeJS.Timeout>();

  // Add scheduled report
  addScheduledReport(report: Omit<ScheduledReport, 'id' | 'createdAt' | 'nextRun'>) {
    const id = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const nextRun = this.calculateNextRun(report.type);
    
    const scheduledReport: ScheduledReport = {
      ...report,
      id,
      createdAt: new Date().toISOString(),
      nextRun
    };

    const key = report.companyId;
    const existing = this.scheduledReports.get(key) || [];
    existing.push(scheduledReport);
    this.scheduledReports.set(key, existing);

    // Schedule the report
    this.scheduleReport(scheduledReport);

    return scheduledReport;
  }

  // Get scheduled reports for company
  getScheduledReports(companyId: string): ScheduledReport[] {
    return this.scheduledReports.get(companyId) || [];
  }

  // Update scheduled report
  updateScheduledReport(companyId: string, reportId: string, updates: Partial<ScheduledReport>) {
    const reports = this.scheduledReports.get(companyId) || [];
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex !== -1) {
      reports[reportIndex] = { ...reports[reportIndex], ...updates };
      this.scheduledReports.set(companyId, reports);
      
      // Reschedule if needed
      if (updates.type || updates.enabled !== undefined) {
        this.unscheduleReport(reportId);
        if (updates.enabled !== false) {
          this.scheduleReport(reports[reportIndex]);
        }
      }
    }
  }

  // Delete scheduled report
  deleteScheduledReport(companyId: string, reportId: string) {
    const reports = this.scheduledReports.get(companyId) || [];
    const filteredReports = reports.filter(r => r.id !== reportId);
    this.scheduledReports.set(companyId, filteredReports);
    
    this.unscheduleReport(reportId);
  }

  // Calculate next run time
  private calculateNextRun(type: ScheduledReport['type']): string {
    const now = new Date();
    
    switch (type) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        now.setHours(9, 0, 0, 0); // 9 AM
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        now.setHours(9, 0, 0, 0); // 9 AM
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        now.setDate(1);
        now.setHours(9, 0, 0, 0); // 9 AM
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        now.setDate(1);
        now.setHours(9, 0, 0, 0); // 9 AM
        break;
      case 'yearly':
        now.setFullYear(now.getFullYear() + 1);
        now.setMonth(0);
        now.setDate(1);
        now.setHours(9, 0, 0, 0); // 9 AM
        break;
    }
    
    return now.toISOString();
  }

  // Schedule a report
  private scheduleReport(report: ScheduledReport) {
    if (!report.enabled) return;

    const nextRunTime = new Date(report.nextRun).getTime();
    const now = Date.now();
    const delay = Math.max(0, nextRunTime - now);

    const timeout = setTimeout(() => {
      this.runScheduledReport(report);
    }, delay);

    this.intervals.set(report.id, timeout);
  }

  // Unschedule a report
  private unscheduleReport(reportId: string) {
    const timeout = this.intervals.get(reportId);
    if (timeout) {
      clearTimeout(timeout);
      this.intervals.delete(reportId);
    }
  }

  // Run scheduled report
  private async runScheduledReport(report: ScheduledReport) {
    try {
      console.log(`Running scheduled report: ${report.name}`);
      
      // Generate report data based on type
      let reportData;
      switch (report.reportType) {
        case 'overview':
          reportData = await this.generateOverviewReport(report.companyId);
          break;
        case 'profit-loss':
          reportData = await this.generateProfitLossReport(report.companyId);
          break;
        case 'expenses':
          reportData = await this.generateExpensesReport(report.companyId);
          break;
        case 'debts':
          reportData = await this.generateDebtsReport(report.companyId);
          break;
        default:
          reportData = { message: 'Report generated successfully' };
      }

      // Send email notifications
      await this.sendReportEmail(report, reportData);

      // Update last run time and schedule next run
      const nextRun = this.calculateNextRun(report.type);
      this.updateScheduledReport(report.companyId, report.id, {
        lastRun: new Date().toISOString(),
        nextRun
      });

      // Create notification
      notificationManager.addNotification({
        type: 'success',
        title: 'Scheduled Report Generated',
        message: `Report "${report.name}" has been generated and sent to ${report.emailRecipients.length} recipient(s)`,
        companyId: report.companyId,
        userId: report.userId
      });

    } catch (error) {
      console.error(`Error running scheduled report ${report.name}:`, error);
      
      // Create error notification
      notificationManager.addNotification({
        type: 'error',
        title: 'Scheduled Report Failed',
        message: `Failed to generate report "${report.name}": ${error}`,
        companyId: report.companyId,
        userId: report.userId
      });
    }
  }

  // Generate overview report
  private async generateOverviewReport(companyId: string) {
    // This would call the actual API endpoint
    return { type: 'overview', data: 'Overview report data' };
  }

  // Generate profit-loss report
  private async generateProfitLossReport(companyId: string) {
    return { type: 'profit-loss', data: 'Profit & Loss report data' };
  }

  // Generate expenses report
  private async generateExpensesReport(companyId: string) {
    return { type: 'expenses', data: 'Expenses report data' };
  }

  // Generate debts report
  private async generateDebtsReport(companyId: string) {
    return { type: 'debts', data: 'Debts report data' };
  }

  // Send report email
  private async sendReportEmail(report: ScheduledReport, reportData: any) {
    // This would integrate with an email service
    console.log(`Sending report "${report.name}" to:`, report.emailRecipients);
    console.log('Report data:', reportData);
    
    // Simulate email sending
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Email sent successfully for report: ${report.name}`);
        resolve(true);
      }, 1000);
    });
  }

  // Initialize scheduler
  initialize() {
    console.log('Report Scheduler initialized');
    
    // Check for overdue reports every hour
    setInterval(() => {
      this.checkOverdueReports();
    }, 60 * 60 * 1000); // 1 hour
  }

  // Check for overdue reports
  private checkOverdueReports() {
    const now = new Date();
    
    for (const [companyId, reports] of this.scheduledReports.entries()) {
      for (const report of reports) {
        if (report.enabled && new Date(report.nextRun) <= now) {
          console.log(`Found overdue report: ${report.name}`);
          this.runScheduledReport(report);
        }
      }
    }
  }
}

// Singleton instance
export const reportScheduler = new ReportScheduler();

// Initialize scheduler
reportScheduler.initialize();

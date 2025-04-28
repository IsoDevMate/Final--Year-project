import { Event } from '../models/event.model';

export class EventCleanupService {
  static async cleanupPastEvents(): Promise<void> {
    const currentDate = new Date();

    // Mark past events as completed
    await Event.updateMany(
      { endDate: { $lt: currentDate }, status: { $ne: 'completed' } },
      { $set: { status: 'completed' } }
    );

    // Delete events with status 'completed'
    await Event.deleteMany({ status: 'completed' });

    console.log(`Past events marked as completed and deleted at ${currentDate}`);
  }
}

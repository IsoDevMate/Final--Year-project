
import { Event } from '../models/event.model';

export class EventCleanupService {
  static async cleanupPastEvents(): Promise<void> {
    const currentDate = new Date();

    // Mark past events as completed
    await Event.updateMany(
      { endDate: { $lt: currentDate }, status: { $ne: 'completed' } },
      { $set: { status: 'completed' } }
    );

    console.log(`Past events marked as completed at ${currentDate}`);
  }
}

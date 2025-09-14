import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor(accessToken: string, refreshToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  async getCalendarEvents(timeMin: string, timeMax: string) {
    const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
    
    try {
      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items || [];
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      throw error;
    }
  }

  async getFreeBusy(timeMin: string, timeMax: string) {
    const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
    
    try {
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: [{ id: "primary" }],
        },
      });

      return response.data.calendars?.primary?.busy || [];
    } catch (error) {
      console.error("Error fetching free/busy data:", error);
      throw error;
    }
  }

  async createEvent(eventDetails: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    attendees: { email: string }[];
    conferenceData?: {
      createRequest: {
        requestId: string;
        conferenceSolutionKey: { type: string };
      };
    };
  }) {
    const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
    
    try {
      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: eventDetails,
        conferenceDataVersion: 1,
      });

      return response.data;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      throw error;
    }
  }

  async updateEvent(eventId: string, eventDetails: any) {
    const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
    
    try {
      const response = await calendar.events.update({
        calendarId: "primary",
        eventId,
        requestBody: eventDetails,
      });

      return response.data;
    } catch (error) {
      console.error("Error updating calendar event:", error);
      throw error;
    }
  }

  async deleteEvent(eventId: string) {
    const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
    
    try {
      await calendar.events.delete({
        calendarId: "primary",
        eventId,
      });

      return true;
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      throw error;
    }
  }
}

export function generateTimeSlots(
  startDate: Date,
  endDate: Date,
  busyTimes: any[],
  durationMinutes: number = 30
): { start: Date; end: Date; available: boolean }[] {
  const slots: { start: Date; end: Date; available: boolean }[] = [];
  const current = new Date(startDate);

  while (current < endDate) {
    const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
    
    // Check if this slot conflicts with busy times
    const isBusy = busyTimes.some((busy) => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      return (
        (current >= busyStart && current < busyEnd) ||
        (slotEnd > busyStart && slotEnd <= busyEnd) ||
        (current <= busyStart && slotEnd >= busyEnd)
      );
    });

    slots.push({
      start: new Date(current),
      end: new Date(slotEnd),
      available: !isBusy,
    });

    current.setTime(current.getTime() + durationMinutes * 60000);
  }

  return slots;
}

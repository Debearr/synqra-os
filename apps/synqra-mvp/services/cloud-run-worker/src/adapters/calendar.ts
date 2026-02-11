import { google } from "googleapis";

type CalendarReminderInput = {
  accessToken: string;
  calendarId?: string;
  summary: string;
  description?: string;
  remindAt: string;
};

function getCalendarClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function createCalendarReminder(input: CalendarReminderInput): Promise<{ eventId: string }> {
  const calendar = getCalendarClient(input.accessToken);
  const calendarId = input.calendarId || "primary";

  const start = new Date(input.remindAt);
  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid remindAt value");
  }

  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 10 }],
      },
    },
  });

  const eventId = response.data.id;
  if (!eventId) {
    throw new Error("Calendar reminder creation returned no event id");
  }

  return { eventId };
}


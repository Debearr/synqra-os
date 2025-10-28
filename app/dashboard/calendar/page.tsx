import { sampleCalendarEvents } from '@/lib/placeholderData';

export default function Calendar() {
  return (
    <div className="space-y-8">
      <header className="border-b border-softGray/20 pb-6">
        <h1 className="text-4xl font-bold text-goldFoil font-playfair">Content Calendar</h1>
        <p className="text-softGray mt-2">Schedule and manage your posts</p>
      </header>

      <div className="flex gap-4">
        <button className="px-6 py-2 bg-goldFoil text-midnightBlack font-medium rounded-lg hover:bg-goldFoil/90 transition-all">
          Schedule Post
        </button>
        <button className="px-6 py-2 bg-transparent border border-neonTeal text-neonTeal font-medium rounded-lg hover:bg-neonTeal/10 transition-all">
          View Calendar
        </button>
      </div>

      <div className="grid gap-4">
        <h2 className="text-2xl font-bold text-white font-playfair">Upcoming Posts</h2>
        {sampleCalendarEvents.map((event) => (
          <div
            key={event.id}
            className="bg-midnightBlack border border-softGray/20 rounded-lg p-6 hover:border-neonTeal/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{event.title}</h3>
                <div className="flex gap-4 mt-2 text-softGray">
                  <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                  <span>🕐 {event.time}</span>
                  <span>📱 {event.platform}</span>
                </div>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  event.status === 'scheduled'
                    ? 'bg-goldFoil/20 text-goldFoil'
                    : 'bg-softGray/20 text-softGray'
                }`}
              >
                {event.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

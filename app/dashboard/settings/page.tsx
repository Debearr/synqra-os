export default function Settings() {
  return (
    <div className="space-y-8">
      <header className="border-b border-softGray/20 pb-6">
        <h1 className="text-4xl font-bold text-goldFoil font-playfair">Settings</h1>
        <p className="text-softGray mt-2">Configure your dashboard preferences</p>
      </header>

      <div className="grid gap-6">
        <div className="bg-midnightBlack border border-softGray/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white font-playfair mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-softGray mb-2">Display Name</label>
              <input
                type="text"
                placeholder="Your Brand Name"
                className="w-full px-4 py-2 bg-midnightBlack border border-softGray/30 rounded-lg text-white focus:border-neonTeal focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-softGray mb-2">Email</label>
              <input
                type="email"
                placeholder="brand@example.com"
                className="w-full px-4 py-2 bg-midnightBlack border border-softGray/30 rounded-lg text-white focus:border-neonTeal focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-midnightBlack border border-softGray/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white font-playfair mb-4">Notifications</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5" />
              <span className="text-softGray">Email notifications for new posts</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5" />
              <span className="text-softGray">Analytics reports (weekly)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5" />
              <span className="text-softGray">Push notifications</span>
            </label>
          </div>
        </div>

        <div className="bg-midnightBlack border border-softGray/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white font-playfair mb-4">Posting Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-softGray mb-2">Default Time Zone</label>
              <select className="w-full px-4 py-2 bg-midnightBlack border border-softGray/30 rounded-lg text-white focus:border-neonTeal focus:outline-none">
                <option>UTC-8 (Pacific)</option>
                <option>UTC-5 (Eastern)</option>
                <option>UTC+0 (GMT)</option>
              </select>
            </div>
            <div>
              <label className="block text-softGray mb-2">Auto-publish Schedule</label>
              <select className="w-full px-4 py-2 bg-midnightBlack border border-softGray/30 rounded-lg text-white focus:border-neonTeal focus:outline-none">
                <option>Disabled</option>
                <option>Daily at 9:00 AM</option>
                <option>Custom schedule</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button className="px-6 py-2 bg-goldFoil text-midnightBlack font-medium rounded-lg hover:bg-goldFoil/90 transition-all">
            Save Changes
          </button>
          <button className="px-6 py-2 bg-transparent border border-softGray text-softGray font-medium rounded-lg hover:bg-softGray/10 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

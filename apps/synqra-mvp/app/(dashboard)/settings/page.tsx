import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500">Manage your account preferences.</p>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-6 max-w-2xl">
                <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="John Doe" />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Email</label>
                        <input type="email" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="john@example.com" />
                    </div>
                    <Button>Save Changes</Button>
                </div>
            </div>
        </div>
    );
}

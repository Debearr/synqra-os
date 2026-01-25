import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function CompliancePage() {
    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Compliance</h1>
                    <p className="text-slate-500">Track FICA status for your deals.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New FICA Request
                </Button>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-900">Client</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Property</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Date Requested</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">John Doe</td>
                            <td className="px-6 py-4 text-slate-600">123 Main St, Sea Point</td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pending
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">Nov 25, 2025</td>
                            <td className="px-6 py-4">
                                <button className="text-blue-600 hover:underline font-medium">Remind</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">Sarah Smith</td>
                            <td className="px-6 py-4 text-slate-600">45 Ocean View, Camps Bay</td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Verified
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">Nov 24, 2025</td>
                            <td className="px-6 py-4">
                                <button className="text-blue-600 hover:underline font-medium">View</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

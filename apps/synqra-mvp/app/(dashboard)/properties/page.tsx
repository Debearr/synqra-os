import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PropertiesPage() {
    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
                    <p className="text-slate-500">Manage your active listings.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                </Button>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No properties yet</h3>
                    <p className="text-slate-500 mb-6">Get started by adding your first property listing. We'll help you generate the description.</p>
                    <Button variant="outline">Import from Portal</Button>
                </div>
            </div>
        </div>
    );
}

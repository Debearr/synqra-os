import { getFusionData } from "./getFusionData";
import { InsightCard } from "./components/InsightCard";
import { InsightList } from "./components/InsightList";
import { InsightFilters } from "./components/InsightFilters";

console.log("[SIV] module initialized");

export default async function Page() {
    const entries = await getFusionData();
    console.log("[SIV] entries loaded:", entries.length);

    return (
        <div>
            <InsightFilters onChange={() => { }} />
            <InsightList entries={entries} />
        </div>
    );
}

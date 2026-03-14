"use client";

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return { text: "Guten Morgen", emoji: "☀️" };
    if (h < 18) return { text: "Guten Tag", emoji: "👋" };
    return { text: "Guten Abend", emoji: "🌙" };
}

export function DashboardGreeting({ name = "Markus" }: { name?: string }) {
    const { text, emoji } = getGreeting();

    return (
        <div className="flex items-center gap-2">
            <span className="text-2xl leading-none select-none">{emoji}</span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {text},{" "}
                <span className="text-primary">{name}</span>
            </h2>
        </div>
    );
}

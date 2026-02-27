"use client";

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return { text: "Guten Morgen", emoji: "☀️" };
    if (h < 18) return { text: "Guten Tag", emoji: "👋" };
    return { text: "Guten Abend", emoji: "🌙" };
}

function getDate() {
    return new Date().toLocaleDateString("de-AT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export function DashboardGreeting({ name = "Markus" }: { name?: string }) {
    const { text, emoji } = getGreeting();

    return (
        <div className="flex items-center justify-between">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl leading-none select-none">{emoji}</span>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {text},{" "}
                        <span className="text-primary">{name}!</span>
                    </h2>
                </div>
                <p className="text-sm text-muted-foreground pl-9">
                    {getDate()} &mdash; Hier ist deine tägliche Übersicht.
                </p>
            </div>
        </div>
    );
}

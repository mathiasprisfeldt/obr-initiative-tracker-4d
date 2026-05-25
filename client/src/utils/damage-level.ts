export type DamageLevel = "none" | "yellow" | "orange" | "red";

export function getDamageLevel(health: number, maxHealth: number): DamageLevel {
    if (maxHealth <= 0) return "none";
    const percentage = (health / maxHealth) * 100;
    if (percentage >= 50) return "none";
    if (percentage >= 25) return "yellow";
    if (percentage >= 15) return "orange";
    return "red";
}

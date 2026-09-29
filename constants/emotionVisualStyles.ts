export interface VisualStyle {
    colorPalette: string;
    lighting: string;
    subject: string;
    artStyle: string;
}

export const EMOTION_VISUAL_STYLES: Record<string, VisualStyle> = {
    love_romance: {
        colorPalette: "warm pastels, soft pink, peach",
        lighting: "golden hour, soft glowing light",
        subject: "blooming flowers, two intertwined objects",
        artStyle: "watercolor, dreamy illustration"
    },
    emotional_down: {
        colorPalette: "slate blue, deep gray, muted indigo",
        lighting: "dim, overcast, rainy atmosphere",
        subject: "raindrops on window, lone silhouette",
        artStyle: "oil painting, melancholic expressionism"
    },
    mental_overload: {
        colorPalette: "high contrast, neon red, deep black",
        lighting: "flickering neon, harsh shadows",
        subject: "tangled threads, fractured mirrors",
        artStyle: "rough acrylic, chaotic abstract"
    },
    depleted_tired: {
        colorPalette: "faded sepia, pale beige, dusty rose",
        lighting: "soft twilight, muted fading light",
        subject: "empty chair, wilting leaf, calm sea",
        artStyle: "minimalism, soft pastel"
    },
    quiet_neutral: {
        colorPalette: "monochrome, soft gray, pale blue",
        lighting: "diffused morning light",
        subject: "still water, single rock, empty room",
        artStyle: "zen illustration, flat vector"
    },
    energy_focus: {
        colorPalette: "vibrant orange, electric blue, neon green",
        lighting: "bright cinematic lighting, glowing aura",
        subject: "geometric shapes, ascending stairs",
        artStyle: "cyberpunk, sharp digital art"
    }
};

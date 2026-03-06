export const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 1.0,
            ease: [0.25, 0.1, 0.25, 1],
        },
    },
};

export const slowFadeInVariant = {
    hidden: { opacity: 0 },
    visible: (customDelay = 0) => ({
        opacity: 1,
        transition: {
            duration: 1.4,
            ease: "easeInOut",
            delay: customDelay,
        },
    }),
};

export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

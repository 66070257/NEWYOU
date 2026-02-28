import React from "react";
import { Button } from "@mui/material";

const STYLES = {
    likes: {
        activeBackground: "#1976d2",
        hoverBackground: "#1565c0",
        inactiveHoverBackground: "rgba(25, 118, 210, 0.14)",
        inactiveActiveBackground: "rgba(25, 118, 210, 0.26)",
        inactiveActiveColor: "#1565c0",
        activeRing: "0 0 0 2px rgba(21, 101, 192, 0.25)",
        inactiveRing: "0 0 0 2px rgba(25, 118, 210, 0.35)"
    },
    dislikes: {
        activeBackground: "#d32f2f",
        hoverBackground: "#b71c1c",
        inactiveHoverBackground: "rgba(211, 47, 47, 0.14)",
        inactiveActiveBackground: "rgba(211, 47, 47, 0.22)",
        inactiveActiveColor: "#b71c1c",
        activeRing: "0 0 0 2px rgba(183, 28, 28, 0.25)",
        inactiveRing: "0 0 0 2px rgba(211, 47, 47, 0.3)"
    }
};

const VoteButton = ({
    type = "likes",
    active = false,
    count = 0,
    onClick,
    disabled = false,
    size = "small",
    outlinedWhenInactive = false,
    inactiveOutlineColor,
    sx = {}
}) => {
    const styleConfig = STYLES[type] ?? STYLES.likes;
    const label = type === "dislikes" ? "DISLIKE" : "LIKE";

    return (
        <Button
            size={size}
            variant="text"
            onClick={onClick}
            disabled={disabled}
            sx={{
                minWidth: 0,
                px: 0.75,
                textTransform: "none",
                transition: "all 0.12s ease",
                color: active ? styleConfig.activeBackground : "inherit",
                fontWeight: active ? 700 : 400,
                border: !active && outlinedWhenInactive
                    ? `1px solid ${inactiveOutlineColor || styleConfig.inactiveActiveColor}`
                    : "none",
                "&:hover": {
                    backgroundColor: active
                        ? styleConfig.hoverBackground
                        : styleConfig.inactiveHoverBackground,
                    color: active ? "#FFFFFF" : styleConfig.inactiveActiveColor
                },
                "&:active": {
                    backgroundColor: active
                        ? styleConfig.hoverBackground
                        : styleConfig.inactiveActiveBackground,
                    color: active ? "#FFFFFF" : styleConfig.inactiveActiveColor,
                    boxShadow: active ? styleConfig.activeRing : styleConfig.inactiveRing,
                    transform: "scale(0.96)"
                },
                ...(active && {
                    backgroundColor: styleConfig.activeBackground,
                    color: "#FFFFFF",
                    "&:hover": {
                        backgroundColor: styleConfig.hoverBackground
                    }
                }),
                ...sx
            }}
        >
            {label} {count}
        </Button>
    );
};

export default VoteButton;

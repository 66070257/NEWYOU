import React from "react";
import { Button } from "@mui/material";

const CircleIconButton = ({
    icon,
    component,
    to,
    state,
    onClick,
    disabled = false,
    borderColor = "black",
    iconColor = "black",
    size = 40,
    sx = {}
}) => {
    return (
        <Button
            component={component}
            to={to}
            state={state}
            onClick={onClick}
            disabled={disabled}
            sx={{
                minWidth: 0,
                border: `2px solid ${borderColor}`,
                borderRadius: "50%",
                width: size,
                height: size,
                color: iconColor,
                transition: "all 0.15s ease",
                "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.12)",
                    boxShadow: "0 0 0 3px rgba(0, 0, 0, 0.16)",
                    transform: "scale(1.06)"
                },
                "&:active": {
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                    transform: "scale(0.97)"
                },
                ...sx
            }}
        >
            {icon}
        </Button>
    );
};

export default CircleIconButton;

import React from "react";
import { FormControl, MenuItem, Select } from "@mui/material";

const SortDropdown = ({
    value,
    onChange,
    options,
    minWidth = 170
}) => {
    return (
        <FormControl size="small" sx={{ minWidth }}>
            <Select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                sx={{
                    borderRadius: "20px",
                    textTransform: "none"
                }}
            >
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default SortDropdown;

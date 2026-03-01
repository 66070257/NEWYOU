import React from "react";
import { TextField } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { SEARCH_UI_TEXT } from "../constants/uiText";

const SearchBar = ({
    value,
    onChange,
    placeholder = SEARCH_UI_TEXT.DEFAULT_PLACEHOLDER,
    sx = {}
}) => {
    return (
        <TextField
            fullWidth
            size="small"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#777777", fontSize: 20 }} />
                    </InputAdornment>
                )
            }}
            sx={{
                maxWidth: "360px",
                "& .MuiOutlinedInput-root": {
                    borderRadius: "999px",
                    backgroundColor: "#FFFFFF"
                },
                ...sx
            }}
        />
    );
};

export default SearchBar;

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#EAEAEA"
    },
    background: {
      default: "#FFFFFF",
      paper: "#F8F9FA"
    },
    text: {
      primary: "#333333",
      secondary: "#777777"
    }
  },
  typography: {
    fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
    fontSize: 16
  }
});

export default theme;
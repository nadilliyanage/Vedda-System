import React from "react";
import { AppBar, Toolbar, Typography, IconButton } from "@mui/material";
import { History, Menu } from "@mui/icons-material";

const Header = ({ onHistoryClick }) => {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{ bgcolor: "#1976d2", color: "white" }}
    >
      <Toolbar>
        <IconButton edge="start" color="inherit" sx={{ mr: 2 }}>
          <Menu />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Vedda Translate
        </Typography>
        <IconButton color="inherit" onClick={onHistoryClick}>
          <History />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
